# Algorithm Examples

## Sentiment Analysis

### Tokenization
```
Input:  "Não muito bom! #produto"
Tokens: ["Não", "muito", "bom", "#produto"]
Normalized (for lexicon): ["nao", "muito", "bom"]  (hashtag excluded)
```

### Scoring Order: Intensifier → Negation → MBRAS

#### Example 1: Normal User
```
"Não muito bom" (user_alice_01)
  → "bom" (+1) × intensifier (1.5) × negation (-1) = -1.5
  → Score: -1.5 / 3 = -0.5 → negative
```

#### Example 2: MBRAS Employee
```
"Super adorei!" (user_mbras_123)
  → "adorei" (+1) × intensifier (1.5) × MBRAS (2) = +3.0
  → Score: 3.0 / 2 = 1.5 → positive
```

#### Example 3: Orphan Intensifier
```
"muito" (user_test_abc)
  → "muito" is an intensifier with no target → score 0
  → 0 / 1 = 0.0 → neutral
```

#### Example 4: Double Negation
```
"não não gostei" (user_test_abc)
  → "gostei" (+1), negation "não" within scope → -1
  → The second "não" doesn't cancel the first for "gostei"
  → Score: -1/3 = -0.333 → negative
```

## User Influence

### SHA-256 Follower Count
```python
followers = (int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % 10000) + 100
```

### Engagement Rate
```
rate = (reactions + shares) / views
If (reactions + shares) % 7 == 0 and > 0: rate × (1 + 1/φ)
If user_id ends with "007": rate × 0.5
```

### Influence Score
```
score = (followers_normalized × 0.4) + (engagement × 0.6)
If MBRAS employee: score + 2.0
```

## Trending Topics

### Weight Calculation
```
temporal_weight = 1 + (1 / max(minutes_since_posting, 0.01))
sentiment_modifier = {positive: 1.2, negative: 0.8, neutral: 1.0}
long_hashtag_factor = log10(len) / log10(8)  if len > 8 chars (excl. #)
weight = temporal_weight × sentiment_modifier × long_hashtag_factor
```

### Ranking
1. Sum of weights (descending)
2. Tiebreak: raw frequency → sentiment weight → lexicographic order

## Anomaly Detection

### Burst
- \>10 messages from same user within 5-minute window

### Alternating Sentiment
- Exact +−+−+− pattern in ≥10 consecutive messages from one user

### Synchronized Posting
- ≥3 messages with timestamps within ±2 seconds from different users
