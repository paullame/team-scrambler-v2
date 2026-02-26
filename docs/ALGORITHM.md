# Scrambling Algorithm

This document describes the two algorithms implemented in
[`src/core/scramble.ts`](src/core/scramble.ts): the **assignment algorithm**
(`scramble`) that distributes people into teams, and the **quality scoring
algorithm** (`computeQuality`) that measures how well-balanced the result is.

---

## 1. Assignment algorithm — `scramble`

### Goal

Distribute $n$ people into $T$ teams such that:

1. Teams are as equal in size as possible (differ by at most 1 member).
2. For each selected balance criterion, the distribution of values across teams
   mirrors the global distribution as closely as possible.

### Why not a classical approach?

Two classical approaches were considered and rejected:

| Approach | Problem |
|---|---|
| **Stratified round-robin** (original) | Groups people by the *combined* key of all criteria. With $k$ criteria, most strata become singletons, turning the algorithm into sequential input-order assignment with no balance guarantee. |
| **Integer Linear Programming** | Optimal, but exponential to solve and overkill for the typical sizes involved (tens to hundreds of people). |

The chosen approach — **greedy assignment with a cost function** — is $O(n \cdot T \cdot k)$, produces near-optimal results in practice, and handles any number of criteria independently.

### Steps

```
1.  Shuffle all people uniformly at random.
2.  Pre-compute global value counts per criterion.
3.  For each person (in shuffled order):
      For each team i:
        cost_i = teamSize_i × (k + 1)
                 + Σ_criterion max(0, newRatio_iv - globalRatio_v)
      Assign person to the team with the lowest cost.
      Update live value counts for that team.
4.  Compute per-team diversity metrics.
```

### Cost function

The cost of assigning a person to team $i$ is:

$$
\text{cost}_i = |T_i| \cdot (k + 1) + \sum_{c=1}^{k} \max\!\left(0,\ \frac{\text{count}_{i,v_c} + 1}{|T_i| + 1} - R_{v_c}\right)
$$

Where:
- $|T_i|$ — current number of members in team $i$
- $k$ — number of balance criteria
- $v_c$ — this person's value for criterion $c$
- $\text{count}_{i,v_c}$ — how many members of team $i$ already have value $v_c$
- $R_{v_c} = \text{count}_{v_c} / n$ — global ratio of value $v_c$ in the population

**Primary term** $|T_i| \cdot (k+1)$: ensures teams are filled evenly before
criterion balance is considered. Scaling by $(k+1)$ guarantees the size term
always outweighs the sum of $k$ criterion penalties (each bounded to $[0, 1]$).

**Secondary terms**: penalise adding to a team only when doing so would push
that team's ratio of $v_c$ *above* the global ratio — i.e. the person would
make that team over-represented. No penalty is applied when adding the person
keeps or improves balance.

### Complexity

| Step | Cost |
|---|---|
| Shuffle | $O(n)$ |
| Global counts | $O(n \cdot k)$ |
| Greedy assignment | $O(n \cdot T \cdot k)$ |
| Metrics computation | $O(n \cdot k)$ |
| **Total** | $O(n \cdot T \cdot k)$ |

For typical inputs (hundreds of people, tens of teams, handful of criteria)
this is effectively linear.

### Guarantees

- Every person appears in exactly one team (shuffle + exhaustive assignment).
- Team sizes differ by at most 1 (enforced by the dominant primary cost term).
- If a person's value is already at or below the global ratio in all teams,
  all teams score 0 on the secondary term and the person goes to the smallest
  team — natural round-robin behaviour.

---

## 2. Quality scoring — `computeQuality`

### Goal

Produce a score in $[0, 1]$ per criterion that answers:

> *Given the constraints of integer people and finite teams, how close is the
> actual distribution to the best possible distribution?*

Scores are normalised between the **theoretically best achievable** result and
the **worst possible** result, not between perfect and worst. This means a
score of 100% means the algorithm did as well as mathematically possible, even
if the population makes perfect balance impossible.

### Cardinality-based mode selection

The right notion of "balance" depends on how many distinct values a criterion has relative to the number of teams $T$:

| Condition | Mode | Rationale |
|---|---|---|
| $V \leq T$ | **Ratio** | Few values → meaningful to check each team reflects global proportions (e.g. gender: female/male should be ~50/50 everywhere) |
| $V > T$ | **Diversity** | Many values → impossible for every team to have exact proportions; the relevant goal is variety (e.g. entity: no team should be all-MKT) |

### Ratio mode (low cardinality, $V \leq T$)

Uses a **weighted Mean Absolute Deviation (MAD)** between team ratios and the
global ratio, normalised per value by global prevalence $R_v = c_v / n$.

For each value $v$:

$$
\text{MAD}_v = \frac{1}{T} \sum_{i=1}^{T} \left| \text{ratio}_{i,v} - R_v \right|
$$

$$
\text{bestMAD}_v = \frac{r \cdot \left|\frac{\lfloor c_v/T \rfloor + 1}{\bar{s}} - R_v\right| + (T-r) \cdot \left|\frac{\lfloor c_v/T \rfloor}{\bar{s}} - R_v\right|}{T}
$$

$$
\text{worstMAD}_v = \frac{2 \cdot R_v \cdot (T-1)}{T}
$$

Where $r = c_v \bmod T$ and $\bar{s} = n/T$.

The per-criterion score:

$$
\text{score} = 1 - \frac{\sum_v R_v \cdot \max(0,\ \text{MAD}_v - \text{bestMAD}_v)}{\sum_v R_v \cdot (\text{worstMAD}_v - \text{bestMAD}_v)}
$$

When $\text{worstMAD}_v = \text{bestMAD}_v$ for all $v$ (only one possible
distribution, e.g. 1 person across 2 teams), the denominator is 0 and score
= 1 — the algorithm did the only thing it could.

**`limited` flag**: set when $c_v < T$ for any value, meaning at least some
teams must have 0 of that value regardless of assignment.

### Diversity mode (high cardinality, $V > T$)

Measures the **average fraction of all $V$ distinct values represented in
each team**, normalised between best achievable and worst case.

For each team $i$:

$$
\text{coverage}_i = \frac{|\text{distinct values in team } i|}{V}
$$

$$
\text{bestCoverage}_i = \frac{\min(V,\ |T_i|)}{V}
\qquad
\text{worstCoverage} = \frac{1}{V}
$$

The per-criterion score:

$$
\text{score} = \frac{\overline{\text{coverage}} - \text{worstCoverage}}{\overline{\text{bestCoverage}} - \text{worstCoverage}}
$$

This rewards spreading rare entities across teams and penalises clustering
(all MKT in team 1, all IT in team 2, etc.).

**`limited` flag**: set when any team's size is smaller than $V$, meaning it
cannot hold all distinct values simultaneously.

### Overall score

$$
\text{overall} = \frac{1}{k} \sum_{c=1}^{k} \text{score}_c
$$

A simple mean across all active balance criteria.

---

## 3. Design decisions

**Greedy over exact optimisation.** Exact solutions (ILP, Hungarian algorithm)
guarantee optimality but are NP-hard in the general multi-criteria case. The
greedy cost function achieves near-optimal balance in $O(n \cdot T \cdot k)$
time, which is instantaneous even for large datasets.

**Shuffle before greedy.** Without an initial shuffle, the assignment is
deterministic and the first people in the CSV always land in team 1. Shuffling
first ensures different results on each run while the greedy pass preserves
balance quality.

**Score normalised to best achievable, not to perfect.** Normalising against
the theoretical best (given integer constraints) means the score reflects
algorithm quality, not data quality. A dataset with one person per entity
across 4 teams cannot give a perfect ratio score — that is a data constraint,
not an algorithm failure. The `limited` flag surfaces this separately.

**Independent per-criterion costs.** Each criterion contributes independently
to the assignment cost. This avoids the combinatorial explosion of the previous
combined-stratum approach: 3 criteria with 2 values each produce 8 possible
strata, most of which have ≤1 member, collapsing the balance guarantee.
