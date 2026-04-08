---
stability: CONSTITUTION
last_validated: 2026-04-08
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Description | Tech Stack |
|-----------|-------------|------------|
| Metadata Extractor | ETL pipeline for extracting and enriching item metadata | Python, BeautifulSoup, LLM |
| Embedding Service | Vector generation and similarity search | sentence-transformers, RedisVL |
| Knowledge Graph Builder | Graph construction and path queries | NetworkX, RedisGraph |
| Quality Scorer | Multi-dimensional scoring engine | Python, scikit-learn |
| Pool Manager | Quality pool CRUD operations | Convex, React |
| LLM Recommender | Recommendation generation API | Claude API, Convex |
| Feedback Processor | Signal aggregation and learning | Convex, Python |
| Analytics Dashboard | Performance monitoring | React, Recharts |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         End Users                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Recommender API                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Recommendations│  │  Explanations│  │    Feedback Ingest   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Quality-Gated Pipeline                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Pool Retrieval│  │Quality Filter│  │  LLM Generation      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data & Intelligence Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   Pools  │  │  Scores  │  │ Embeddings│  │Knowledge Graph│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
└───────┼─────────────┼─────────────┼───────────────┼───────────┘
        │             │             │               │
        ▼             ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Convex   │  │  Redis   │  │Vector DB │  │  PostgreSQL  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          ▲             ▲             ▲
          │             │             │
    ┌─────┴─────┐ ┌────┴─────┐ ┌────┴─────┐
    │ Metadata  │ │ Quality  │ │ Graph    │
    │ Extractor │ │ Scorer   │ │ Builder  │
    └───────────┘ └──────────┘ └──────────┘

External Dependencies:
{Claude API} {sentence-transformers} {RedisVL} {NetworkX}
```

## Data Schema

### Item
```typescript
{
  id: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  attributes: Record<string, any>;
  metadata_quality_score: number; // 0-100
  embedding_id: string;
  created_at: string;
  updated_at: string;
}
```

### Embedding
```typescript
{
  id: string;
  item_id: string;
  vector: number[]; // 384-dimensional
  model_version: string;
  created_at: string;
}
```

### QualityScore
```typescript
{
  id: string;
  item_id: string;
  relevance: number; // 0-100
  freshness: number; // 0-100
  diversity: number; // 0-100
  expert_approval: boolean;
  overall_score: number; // 0-100
  calculated_at: string;
}
```

### TasteProfile
```typescript
{
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Pool
```typescript
{
  id: string;
  profile_id: string;
  name: string;
  items: string[]; // item IDs
  min_size: number;
  max_size: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Feedback
```typescript
{
  id: string;
  item_id: string;
  profile_id?: string;
  signal: 'helpful' | 'not_helpful' | 'skip' | 'save';
  timestamp: string;
}
```

## API Design

### Metadata Service
- `POST /api/metadata/extract` - Extract metadata from item
- `GET /api/metadata/:itemId` - Get item metadata
- `PUT /api/metadata/:itemId` - Update item metadata
- `GET /api/metadata/validate` - Validate metadata quality

### Profile Service
- `POST /api/profiles` - Create taste profile
- `GET /api/profiles` - List all profiles
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/profiles/:id/map` - Map items to profile

### Curation Service
- `POST /api/pools` - Create quality pool
- `GET /api/pools` - List all pools
- `PUT /api/pools/:id` - Update pool items
- `GET /api/pools/:id/candidates` - Get suggested candidates
- `POST /api/pools/:id/approve` - Approve candidate item
- `GET /api/pools/:id/performance` - Get pool metrics

### Recommendation Service
- `POST /api/recommendations` - Generate recommendations
- `POST /api/recommendations/:id/feedback` - Submit feedback
- `GET /api/recommendations/:id/explain` - Get explanation

## External Dependencies

| Component | Dependency | Purpose | Documentation |
|-----------|------------|---------|---------------|
| Embedding Service | sentence-transformers | Vector generation | https://www.sbert.net |
| Vector Storage | RedisVL | Vector similarity search | https://redis.io/docs/stack/search |
| Knowledge Graph | NetworkX | Graph operations | https://networkx.org |
| LLM Generation | Claude API | Recommendation text | https://docs.anthropic.com |

## UI Infrastructure

**Design Libraries**:
- React 18+ with TypeScript
- Radix UI for component primitives
- Recharts for data visualization

**Style Tokens**:
```css
--color-quality-high: #10b981;
--color-quality-medium: #f59e0b;
--color-quality-low: #ef4444;
--font-size-recommendation: 1rem;
--spacing-dashboard-grid: 1.5rem;
```

**Component Reuse**:
- Reusing: Button, Input, Select, Modal, Table, Card, Badge, Tooltip
- New: QualityScoreBadge, ItemCard, PoolList, KnowledgeGraphViz, ExplanationTooltip
