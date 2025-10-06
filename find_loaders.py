import pandas as pd
import json

# Read the Excel file
df = pd.read_excel('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx', header=None)

# Find rows that contain wheel loader
for i in range(len(df)):
    row_str = str(df.iloc[i].tolist()).lower()
    if 'wheel loader' in row_str or 'loader' in row_str:
        print(f"Row {i}: {df.iloc[i].tolist()}")
