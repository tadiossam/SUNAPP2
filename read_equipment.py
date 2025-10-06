import pandas as pd
import json

# Read the Excel file
df = pd.read_excel('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx')

# Convert to JSON
print(json.dumps(df.to_dict(orient='records'), indent=2, default=str))
