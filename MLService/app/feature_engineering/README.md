# Feature Engineering Module

## Production-Grade, Fault-Tolerant Feature Engineering System

A fully automatic, backend-only feature engineering module for the AutoML platform.

---

## 🎯 Overview

This module provides automatic feature engineering with:

- ✅ **Full Fault Tolerance** - Individual transformer failures don't crash the pipeline
- ✅ **Modular Architecture** - Each transformation is isolated in its own file
- ✅ **Backend-Only Execution** - No frontend control required
- ✅ **Deterministic Behavior** - Same input always produces same output
- ✅ **Production Ready** - Comprehensive error handling and logging
- ✅ **Training/Prediction Compatible** - Same transformations apply during both phases

---

## 📁 File Structure

```
app/feature_engineering/
├── __init__.py
├── feature_engineering_service.py    # Main orchestrator
│
├── core/
│   ├── base_transformer.py           # Abstract base class
│   ├── safe_executor.py              # Fault-tolerant execution wrapper
│   └── feature_registry.py           # Central transformer registry
│
├── numeric/
│   ├── log_transform.py              # Logarithmic transformation
│   ├── sqrt_transform.py             # Square root transformation
│   ├── binning.py                    # Quantile-based binning
│   ├── interaction.py                # Feature interactions (mult/div)
│   └── aggregation.py                # Row-wise aggregations
│
├── categorical/
│   ├── frequency_encoding.py         # Frequency encoding
│   ├── count_encoding.py             # Count encoding
│   └── cardinality.py                # Cardinality features
│
└── datetime/
    └── datetime_extractor.py         # Extract date/time components
```

---

## 🔧 Core Architecture

### 1. Base Transformer (`core/base_transformer.py`)

All transformers inherit from `BaseFeatureTransformer`:

```python
class BaseFeatureTransformer(ABC):
    @abstractmethod
    def apply(self, df: pd.DataFrame, target_column: str = None) -> Dict:
        """
        Returns:
        {
            "df": transformed_df,
            "new_features": List[str]
        }
        """
        pass
```

### 2. Safe Executor (`core/safe_executor.py`)

Executes transformers with fault tolerance:

- Wraps each transformer in try/except
- If transformer fails: logs error, continues pipeline
- Never propagates exceptions upward
- Returns status for each transformer

### 3. Feature Registry (`core/feature_registry.py`)

Central registry for all transformers:

```python
NUMERIC_TRANSFORMERS = [
    LogTransformer(),
    SqrtTransformer(),
    BinningTransformer(),
    InteractionTransformer(),
    AggregationTransformer()
]

CATEGORICAL_TRANSFORMERS = [
    FrequencyEncodingTransformer(),
    CountEncodingTransformer(),
    CardinalityTransformer()
]

DATETIME_TRANSFORMERS = [
    DatetimeExtractor()
]
```

---

## 🚀 Usage

### Basic Usage

```python
from app.feature_engineering import FeatureEngineeringService

# Initialize service
fe_service = FeatureEngineeringService()

# Apply feature engineering
transformed_df = fe_service.apply(
    df,
    exclude_columns=['target'],
    verbose=True
)

# Get metadata
metadata = fe_service.get_metadata()
```

### Integration with Training Pipeline

Feature engineering is **automatically integrated** in `training_service.py`:

```python
# In training_service.py - Step 3
df = self.feature_engineering_service.apply(
    df, 
    exclude_columns=[self.target_column], 
    verbose=verbose
)

metadata = self.feature_engineering_service.get_metadata()
```

**Pipeline Flow:**
1. Load dataset
2. Apply preprocessing
3. **✨ Apply Feature Engineering** ← Automatic, before split
4. Detect problem type
5. Split into train/test
6. Train models
7. Evaluate & tune
8. Save models

---

## 🔍 Transformers

### Numeric Transformers

#### Log Transform (`numeric/log_transform.py`)
- **Rule:** Only if min > 0 and |skewness| > 1
- **Creates:** `{feature}_log`
- **Use case:** Highly skewed distributions

#### Sqrt Transform (`numeric/sqrt_transform.py`)
- **Rule:** Only if min >= 0
- **Creates:** `{feature}_sqrt`
- **Use case:** Moderate skewness reduction

#### Binning (`numeric/binning.py`)
- **Rule:** Quantile-based binning (5 bins)
- **Creates:** `{feature}_binned`
- **Use case:** Discretization of continuous features

#### Interaction (`numeric/interaction.py`)
- **Rule:** Only if 2-5 numeric columns
- **Creates:** `{f1}_x_{f2}`, `{f1}_div_{f2}`
- **Use case:** Capture feature relationships

#### Aggregation (`numeric/aggregation.py`)
- **Rule:** Only if ≥3 numeric columns
- **Creates:** `numeric_mean`, `numeric_std`, `numeric_min`, `numeric_max`
- **Use case:** Row-wise statistics

### Categorical Transformers

#### Frequency Encoding (`categorical/frequency_encoding.py`)
- **Creates:** `{feature}_freq`
- **Use case:** Encode with relative frequency

#### Count Encoding (`categorical/count_encoding.py`)
- **Creates:** `{feature}_count`
- **Use case:** Encode with absolute count

#### Cardinality (`categorical/cardinality.py`)
- **Creates:** `{feature}_cardinality`
- **Use case:** Capture category complexity

### Datetime Transformers

#### Datetime Extractor (`datetime/datetime_extractor.py`)
- **Detection:** By dtype or column name containing 'date'/'time'
- **Creates:** `{feature}_year`, `{feature}_month`, `{feature}_day`, `{feature}_dayofweek`, `{feature}_quarter`
- **Use case:** Extract temporal components

---

## 🛡️ Fault Tolerance

### How It Works

When a transformer fails:

1. **Error is caught** by SafeExecutor
2. **Error is logged** with transformer name
3. **Original dataframe** is returned unchanged for that transform
4. **Pipeline continues** with next transformer
5. **Failure is recorded** in metadata

### Example

```
LogTransform → ❌ FAILED (all values negative)
SqrtTransform → ✅ SUCCESS (created 3 features)
Interaction → ✅ SUCCESS (created 6 features)

Pipeline continues successfully!
```

No exceptions propagate to training pipeline.

---

## 📊 Metadata

The service tracks comprehensive metadata:

```python
{
    "feature_engineering_enabled": True,
    "original_feature_count": 10,
    "engineered_feature_count": 15,
    "final_feature_count": 25,
    "new_features": ["feat1_log", "feat2_sqrt", ...],
    "successful_transformations": ["LogTransformer", "SqrtTransformer", ...],
    "failed_transformations": ["InteractionTransformer"],
    "column_types": {
        "numeric": ["age", "income"],
        "categorical": ["category"],
        "datetime": ["date_col"]
    },
    "execution_details": [...]
}
```

---

## 🎨 Frontend Integration

### What Frontend Can Display

```
Feature Engineering: ✅ Automatic
Original Features: 10
New Features: 15
Failed Transforms: 1
```

### What Frontend CANNOT Control

- ❌ Choose specific transformations
- ❌ Toggle individual transformers
- ❌ Pass transformation parameters
- ❌ Enable/disable feature engineering

**Reason:** Backend-only execution ensures consistency and reproducibility.

---

## 🔄 Prediction Compatibility

### During Training

Metadata is saved with the model:

```python
{
    "engineered_features": [...],
    "feature_names": [...],
    "feature_engineering_enabled": True
}
```

### During Prediction

Same transformations are applied:

1. Load model metadata
2. Apply same feature engineering transformations
3. Ensure missing engineered columns have default values
4. Reorder columns to match training
5. Make predictions

---

## ✅ Success Criteria

- [x] One transformer failure does NOT break pipeline
- [x] Modular architecture
- [x] Clean separation of concerns
- [x] Fully backend controlled
- [x] Deterministic behavior
- [x] Compatible with training and prediction
- [x] Production ready
- [x] Comprehensive logging
- [x] Metadata tracking

---

## 🧪 Testing

Run the example usage:

```bash
cd MLService
python feature_engineering_examples.py
```

Or integrate with training:

```python
from app.training.training_service import TrainingService

service = TrainingService(target_column='target')
results = service.run_complete_pipeline(df)

# Feature engineering runs automatically at step 3
```

---

## 📝 Adding New Transformers

### Step 1: Create Transformer File

Create `app/feature_engineering/{category}/{transformer_name}.py`:

```python
from ..core.base_transformer import BaseFeatureTransformer

class MyTransformer(BaseFeatureTransformer):
    def apply(self, df, target_column=None):
        result_df = df.copy()
        new_features = []
        
        # Your transformation logic here
        
        return {
            "df": result_df,
            "new_features": new_features
        }
```

### Step 2: Register Transformer

Add to `app/feature_engineering/core/feature_registry.py`:

```python
from ..{category}.{transformer_name} import MyTransformer

# In appropriate getter method:
cls._numeric_transformers = [
    ...,
    MyTransformer()  # Add here
]
```

### Step 3: Test

The transformer is now automatically executed!

---

## 🐛 Troubleshooting

### Transformer Always Fails

- Check preconditions (e.g., min > 0 for log transform)
- Review error messages in logs
- Verify data types

### Features Not Created

- Check if preconditions are met
- Verify transformer is registered
- Check verbose logs

### Pipeline Crashes

- Should never happen due to fault tolerance
- If it does, check SafeExecutor implementation
- Report as critical bug

---

## 📚 References

- **Main Service:** [feature_engineering_service.py](feature_engineering_service.py)
- **Base Class:** [core/base_transformer.py](core/base_transformer.py)
- **Safe Executor:** [core/safe_executor.py](core/safe_executor.py)
- **Registry:** [core/feature_registry.py](core/feature_registry.py)

---

## 🎉 Summary

This feature engineering module provides:

- **Automatic** feature creation
- **Fault-tolerant** execution
- **Modular** design
- **Production-ready** implementation
- **Zero frontend control** required
- **Deterministic** and **reproducible** results

Perfect for AutoML platforms requiring robust, automatic feature engineering! 🚀
