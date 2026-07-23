#!/usr/bin/env python3
"""
Realistic balance simulator for Backrooms Clicker.
Simulates: clicking, buying allies, gear drops, levels, prestige.
Target: first rebirth at 30-40 minutes, levels not too fast.
"""
import math, json, re, sys

# === TUNING PARAMETERS ===
ECHO_DIVISOR = 7e5  # actual game value
LEVEL_COST_MULT = 1.0  # costs are already 4x in the game data
# First 3 gens reverted to original in game data
GEN_PROD_OVERRIDES = {}  # no overrides needed, game data is already correct

# Game constants
ALLY_GROWTH = 1.15
COMBO_DECAY_MS = 900
CLICK_RATE = 3  # clicks per second (active player)
TICK = 0.1  # 100ms

# Parse gameData.ts for LEVELS and GENERATORS
with open('src/gameData.ts', 'r', encoding='utf-8') as f:
    gd = f.read()

# Extract LEVELS array
levels_match = re.search(r'export const LEVELS.*?\[(.*?)\];', gd, re.DOTALL)
levels_raw = levels_match.group(1)
levels = []
for m in re.finditer(r'\{[^}]*"unlockCost":\s*([\d.]+)[^}]*"mult":\s*([\d.]+)', levels_raw):
    levels.append({'unlockCost': float(m.group(1)) * LEVEL_COST_MULT, 'mult': float(m.group(2))})

# Extract GENERATORS array
gen_match = re.search(r'export const GENERATORS.*?\[(.*?)\];', gd, re.DOTALL)
gens_raw = gen_match.group(1)
generators = []
for m in re.finditer(r'\{[^}]*"baseCost":\s*([\d.]+)[^}]*"baseProd":\s*([\d.]+)', gens_raw):
    generators.append({'baseCost': float(m.group(1)), 'baseProd': float(m.group(2))})

# Apply overrides for first 3 generators (revert the boosts)
for idx, prod in GEN_PROD_OVERRIDES.items():
    if idx < len(generators):
        generators[idx]['baseProd'] = prod

print(f"Parsed {len(levels)} levels, {len(generators)} generators")
print(f"Level 0: cost={levels[0]['unlockCost']}, mult={levels[0]['mult']}")
print(f"Level 1: cost={levels[1]['unlockCost']}, mult={levels[1]['mult']}")
print(f"Level 5: cost={levels[5]['unlockCost']}, mult={levels[5]['mult']}")
print(f"Level 10: cost={levels[10]['unlockCost']}, mult={levels[10]['mult']}")
print(f"Gen 0: cost={generators[0]['baseCost']}, prod={generators[0]['baseProd']}")
print(f"Gen 1: cost={generators[1]['baseCost']}, prod={generators[1]['baseProd']}")
print()

def gen_cost(base_cost, owned, growth=ALLY_GROWTH):
    return math.ceil(base_cost * (growth ** owned))

def production(owned_gens, level_mult, gear_prod_mult=1.0, buff_prod=1.0):
    p = sum(n * g['baseProd'] for g, n in zip(generators, owned_gens))
    return p * level_mult * gear_prod_mult * buff_prod

def click_power(level_mult, gear_click_mult=1.0, combo=0, buff_click=1.0):
    base = 1 * gear_click_mult * level_mult
    combo_m = 1 + (1 - math.exp(-combo / 30)) * 7
    return base * combo_m * buff_click

def pending_echoes(lifetime_aw):
    return max(0, int(lifetime_aw / ECHO_DIVISOR) ** (1/3))

def simulate(max_time=7200, verbose=True):
    """Simulate a fresh playthrough. Returns milestones."""
    aw = 0
    total_aw = 0
    lifetime_aw = 0
    owned = [0] * len(generators)
    level_idx = 0
    combo = 0
    last_click = 0
    time = 0
    clicks = 0
    gear_click_mult = 1.0
    gear_prod_mult = 1.0
    buff_click = 1.0
    buff_prod = 1.0
    buff_until = 0
    gear_owned = 0  # simplified: just count
    
    milestones = []
    next_milestone_idx = 1
    prestige_count = 0
    total_echoes = 0
    
    # Track when we can afford each level
    level_times = {}
    gen_times = {}
    click_accum = 0.0
    
    while time < max_time:
        dt = TICK
        time += dt
        
        # Decay combo
        if time - last_click > COMBO_DECAY_MS / 1000:
            combo = 0
        
        # Expire buff
        if time > buff_until:
            buff_click = 1.0
            buff_prod = 1.0
        
        # Production
        lvl_mult = levels[level_idx]['mult']
        prod = production(owned, lvl_mult, gear_prod_mult, buff_prod)
        aw += prod * dt
        total_aw += prod * dt
        lifetime_aw += prod * dt
        
        # Clicking (active player) — use accumulator for fractional clicks
        click_accum += CLICK_RATE * dt
        while click_accum >= 1.0:
            click_accum -= 1.0
            combo += 1
            last_click = time
            cp = click_power(lvl_mult, gear_click_mult, combo, buff_click)
            aw += cp
            total_aw += cp
            lifetime_aw += cp
            clicks += 1
        
        # Buy allies (greedy: buy the cheapest affordable one)
        bought = True
        while bought:
            bought = False
            for i, g in enumerate(generators):
                cost = gen_cost(g['baseCost'], owned[i])
                if aw >= cost:
                    aw -= cost
                    owned[i] += 1
                    bought = True
                    if i not in gen_times:
                        gen_times[i] = time
                    break
        
        # Unlock next level
        if level_idx + 1 < len(levels):
            next_cost = levels[level_idx + 1]['unlockCost']
            if aw >= next_cost and level_idx + 1 not in level_times:
                # Check prestige gate
                gate = 0
                if level_idx + 1 >= 31: gate = 3
                elif level_idx + 1 >= 28: gate = 2
                elif level_idx + 1 >= 24: gate = 1
                if prestige_count >= gate:
                    aw -= next_cost
                    level_idx += 1
                    level_times[level_idx] = time
                    if verbose:
                        print(f"  [{time/60:.1f}m] Unlocked Level {level_idx} (cost={next_cost:.0f})")
        
        # Check prestige
        echoes = pending_echoes(lifetime_aw)
        if echoes > 0 and time > 60:  # at least 1 min before first prestige
            if echoes > total_echoes:
                if verbose and prestige_count == 0:
                    print(f"\n*** FIRST PRESTIGE at {time/60:.1f}m ***")
                    print(f"    Lifetime AW: {lifetime_aw:.0f}")
                    print(f"    Echoes earned: {echoes}")
                    print(f"    Level reached: {level_idx}")
                    print(f"    Generators owned: {sum(owned)}")
                    print(f"    Total clicks: {clicks}")
                    milestones.append(('first_prestige', time, echoes, level_idx))
                
                # Prestige: reset run, keep echoes
                prestige_count += 1
                total_echoes = echoes
                aw = 0
                total_aw = 0
                owned = [0] * len(generators)
                level_idx = 0
                combo = 0
                # Keep lifetime_aw for echo calc
                if prestige_count >= 10:
                    break  # stop after 10 prestiges for testing
    
    if verbose:
        print(f"\n=== FINAL STATE at {time/60:.1f}m ===")
        print(f"  AW: {aw:.0f}")
        print(f"  Lifetime AW: {lifetime_aw:.0f}")
        print(f"  Level: {level_idx}")
        print(f"  Prestiges: {prestige_count}")
        print(f"  Total Echoes: {total_echoes}")
        print(f"  Generators: {sum(owned)}")
        print(f"  Production/s: {production(owned, levels[level_idx]['mult']):.1f}")
        print(f"  Click power: {click_power(levels[level_idx]['mult'], 1, combo):.1f}")
        
        print(f"\n=== LEVEL TIMELINE ===")
        for lvl in sorted(level_times.keys()):
            print(f"  Level {lvl}: {level_times[lvl]/60:.1f}m")
        
        print(f"\n=== GENERATOR TIMELINE (first purchase) ===")
        for gi in sorted(gen_times.keys())[:10]:
            print(f"  Gen {gi} ({generators[gi]['baseCost']:.0f} cost): {gen_times[gi]/60:.1f}m")
    
    return milestones, level_times, gen_times, time

if __name__ == '__main__':
    print("=== REALISTIC BALANCE SIMULATION ===")
    print(f"Click rate: {CLICK_RATE}/s, Ally growth: {ALLY_GROWTH}")
    print(f"Echo divisor: {ECHO_DIVISOR}")
    print()
    
    milestones, level_times, gen_times, total_time = simulate(max_time=7200)
    
    fp = [m for m in milestones if m[0] == 'first_prestige']
    if fp:
        t = fp[0][1] / 60
        print(f"\n>>> FIRST PRESTIGE: {t:.1f} minutes")
        if t < 30:
            print(f"    WARNING: Too fast! Target is 30-40 min. Need to slow down by {30/t:.1f}x")
        elif t > 40:
            print(f"    WARNING: Too slow! Target is 30-40 min. Need to speed up by {t/40:.1f}x")
        else:
            print(f"    OK: Within target range")
    else:
        print(f"\n>>> NO PRESTIGE within {total_time/60:.0f}m — way too slow!")
    
    # Level progression rate
    l5 = level_times.get(5, None)
    l10 = level_times.get(10, None)
    print(f"\n>>> Level 5: {'not reached' if l5 is None else f'{l5/60:.1f}m'}")
    print(f">>> Level 10: {'not reached' if l10 is None else f'{l10/60:.1f}m'}")
    if l5 is not None:
        if l5/60 < 5:
            print(f"    WARNING: Level 5 too fast (target: ~8-12m)")
