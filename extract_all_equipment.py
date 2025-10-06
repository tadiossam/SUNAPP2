import pandas as pd
import json

# Read with proper headers
df = pd.read_excel('attached_assets/EQUIPMENT MASTER LIST -SEPTEMBER 2018 E.C_1759791262397.xlsx', header=4)

# Filter for relevant equipment types
relevant_types = ['DOZER', ' DOZER', 'WHEEL   LOADER', 'WHEEL LOADER']
df_filtered = df[df['EQUIPMENT TYPE'].str.strip().isin([t.strip() for t in relevant_types])]

# Clean up
equipment_list = []
for _, row in df_filtered.iterrows():
    eq_type = str(row['EQUIPMENT TYPE']).strip().replace('   ', ' ')
    equipment = {
        'equipmentType': 'WHEEL LOADER' if 'LOADER' in eq_type else 'DOZER',
        'make': str(row['MAKE']).strip() if pd.notna(row['MAKE']) else '',
        'model': str(row['MODEL']).strip() if pd.notna(row['MODEL']) else '',
        'plateNumber': str(row['PLATE NO.']).strip() if pd.notna(row['PLATE NO.']) else '',
        'assetNumber': str(row['ASSET NO.']).strip() if pd.notna(row['ASSET NO.']) else '',
        'newAssetNumber': str(row['NEW ASSET NO.']).strip() if pd.notna(row['NEW ASSET NO.']) else '',
        'serialNumber': str(row['MACHINE SERIAL NO.']).strip() if pd.notna(row['MACHINE SERIAL NO.']) else '',
    }
    # Skip if essential data is missing
    if equipment['make'] and equipment['model']:
        equipment_list.append(equipment)

print(json.dumps(equipment_list, indent=2))
