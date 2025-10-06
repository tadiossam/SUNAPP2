import pandas as pd
import json

# Read the Excel file with specific headers
df = pd.read_excel('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx', header=None)

# Print first 20 rows to understand structure
print("First 20 rows:")
for i in range(min(20, len(df))):
    print(f"Row {i}: {df.iloc[i].tolist()}")
