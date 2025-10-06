export const translations = {
  en: {
    // Authentication
    login: "Login",
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    logout: "Logout",
    selectLanguage: "Select Language",
    
    // Navigation
    equipment: "Equipment",
    spareParts: "Spare Parts",
    models3D: "3D Models",
    maintenance: "Maintenance",
    
    // Common
    search: "Search",
    filter: "Filter",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    view: "View",
    loading: "Loading",
    noData: "No data available",
    
    // Equipment
    equipmentType: "Equipment Type",
    make: "Make",
    model: "Model",
    plateNumber: "Plate Number",
    assetNumber: "Asset Number",
    newAssetNumber: "New Asset Number",
    serialNumber: "Serial Number",
    dozer: "Dozer",
    wheelLoader: "Wheel Loader",
    
    // Spare Parts
    partNumber: "Part Number",
    partName: "Part Name",
    category: "Category",
    price: "Price",
    stockQuantity: "Stock Quantity",
    stockStatus: "Stock Status",
    inStock: "In Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    description: "Description",
    specifications: "Specifications",
    
    // 3D Models
    view3DModel: "View 3D Model",
    models: "3D Models",
    dragToRotate: "Drag to rotate 360°",
    autoRotating: "Auto-rotating",
    clickPlayForAutoRotation: "Click play for auto-rotation",
    
    // Actions
    addEquipment: "Add Equipment",
    addSparePart: "Add Spare Part",
    viewDetails: "View Details",
    
    // Messages
    loginSuccess: "Login successful",
    loginError: "Invalid username or password",
  },
  am: {
    // Authentication
    login: "መግባት",
    username: "የተጠቃሚ ስም",
    password: "የይለፍ ቃል",
    signIn: "ግባ",
    logout: "ውጣ",
    selectLanguage: "ቋንቋ ይምረጡ",
    
    // Navigation
    equipment: "መሳሪያዎች",
    spareParts: "የመለዋወጫ ክፍሎች",
    models3D: "3D ሞዴሎች",
    maintenance: "ጥገና",
    
    // Common
    search: "ፈልግ",
    filter: "አጣራ",
    add: "አክል",
    edit: "አርትዕ",
    delete: "ሰርዝ",
    save: "አስቀምጥ",
    cancel: "ሰርዝ",
    close: "ዝጋ",
    view: "ይመልከቱ",
    loading: "በመጫን ላይ",
    noData: "መረጃ የለም",
    
    // Equipment
    equipmentType: "የመሳሪያ አይነት",
    make: "ምርት",
    model: "ሞዴል",
    plateNumber: "ታርጋ ቁጥር",
    assetNumber: "የንብረት ቁጥር",
    newAssetNumber: "አዲስ የንብረት ቁጥር",
    serialNumber: "ተከታታይ ቁጥር",
    dozer: "ዶዘር",
    wheelLoader: "ዊል ሎደር",
    
    // Spare Parts
    partNumber: "የክፍል ቁጥር",
    partName: "የክፍል ስም",
    category: "ምድብ",
    price: "ዋጋ",
    stockQuantity: "የመጋዘን መጠን",
    stockStatus: "የመጋዘን ሁኔታ",
    inStock: "በመጋዘን ውስጥ",
    lowStock: "አነስተኛ መጋዘን",
    outOfStock: "ከመጋዘን ወጥቷል",
    description: "መግለጫ",
    specifications: "ዝርዝር መግለጫ",
    
    // 3D Models
    view3DModel: "3D ሞዴል ይመልከቱ",
    models: "3D ሞዴሎች",
    dragToRotate: "ለማዞር ይጎትቱ 360°",
    autoRotating: "በራስ ሰር እየዞረ",
    clickPlayForAutoRotation: "ለራስ ሰር ማዞር አጫውት ጠቅ ያድርጉ",
    
    // Actions
    addEquipment: "መሳሪያ አክል",
    addSparePart: "መለዋወጫ አክል",
    viewDetails: "ዝርዝር ይመልከቱ",
    
    // Messages
    loginSuccess: "በተሳካ ሁኔታ ገብተዋል",
    loginError: "የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል",
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
