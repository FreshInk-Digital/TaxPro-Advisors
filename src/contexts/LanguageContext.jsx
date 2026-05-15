// File: src/contexts/LanguageContext.jsx
// Full i18n context — syncs with API-fetched languages + static UI strings

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { languagesApi } from "@/lib/api";

const LanguageContext = createContext(null);

// ---------------------------------------------------------------------------
// Static UI translations (keys used across the entire frontend)
// ---------------------------------------------------------------------------
const uiTranslations = {
  en: {
    // Navbar
    home: "Home",
    services: "Services",
    documentation: "Documentation",
    posters: "Posters",
    adminPortal: "Admin Portal",

    // Auth
    adminLogin: "Admin Login",
    adminLoginDesc: "Sign in to access the TaxProConsult management portal",
    username: "Email Address",
    password: "Password",
    login: "Sign In",
    logout: "Sign Out",
    invalidCredentials: "Invalid email or password. Please try again.",
    backToHome: "Back to Home",
    forgotPassword: "Forgot Password?",
    sendOtp: "Send Reset Code",
    verifyOtp: "Verify Code",
    resetPassword: "Reset Password",
    enterOtp: "Enter 6-digit OTP",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",

    // Service Request Form
    serviceRequest: "Submit a Service Request",
    serviceRequestDesc: "Fill in the form below and our expert team will respond promptly.",
    backToServices: "Back to Services",
    selectedService: "Select Service",
    firstName: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    companyName: "Company Name",
    workEmail: "Email Address",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    phone: "Phone (e.g. 255712345678)",
    projectDetails: "Message",
    projectPlaceholder: "Describe your tax situation or what you need help with...",
    supportingDocs: "Supporting Documents",
    clickUpload: "Click to upload or drag and drop",
    fileTypes: "PDF, XLSX, DOC, PNG, JPG (max 20MB)",
    submitSecure: "Submit Request",
    encryptedNote: "Your information is encrypted and handled with strict confidentiality.",
    optional: "optional",

    // Services Page
    expertTaxServices: "Expert Tax Services",
    servicesPageDesc: "Comprehensive tax advisory tailored to your business and personal needs.",
    newFeature: "New Feature",
    smartDiagnostic: "Smart Tax Diagnostic",
    diagnosticDesc: "Answer a few questions and get a personalized tax recommendation in minutes.",
    runDiagnostic: "Run Tax Diagnostic",
    incomeQuestion: "What best describes your primary income source?",
    w2Employment: "W-2 / Salaried Employment",
    businessOwner: "Business Owner / Self-Employed",
    investmentsCapital: "Investments & Capital Gains",
    continueBtn: "Continue",
    readyGetStarted: "Ready to get started?",
    readyDesc: "Contact our advisors for a personalized consultation.",
    directLine: "Direct Line",
    emailSupport: "Email Support",
    fullNameLabel: "Full Name",
    selectServiceShort: "Select a service",
    additionalInfo: "Additional Information",
    submitRequest: "Submit Request",
    secureNote: "🔒 Your information is 100% secure and confidential",
    corporateTax: "Corporate Tax Planning",

    // Posters Page
    postersTitle: "Posters & Resources",
    postersPageDesc: "Download helpful tax guides, infographics, and educational materials.",
    download: "Download",
    preview: "Preview",

    // Documentation Page
    docTitle: "Document Library",
    docDesc: "Download tax forms, compliance guides, and educational materials.",
    searchDocs: "Search documents...",
    categories: "Categories",

    // Admin
    dashboard: "Dashboard Overview",
    contentPosters: "Content & Posters",
    serviceRequests: "Service Requests",
    settings: "Settings",
    languages: "Languages",
    servicesManagement: "Services",
    documentsManagement: "Documents",
    usersManagement: "Users",
    totalRequests: "Total Requests",
    publishedPages: "Active Services",
    postersUploaded: "Posters Uploaded",
    activeLanguages: "Active Languages",
    viewLiveSite: "View Live Site",
    addNew: "Add New",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    actions: "Actions",
    name: "Name",
    title: "Title",
    description: "Description",
    uploadFile: "Upload File",
    uploadImage: "Upload Image",
    translations: "Translations",
    addTranslation: "Add Translation",
    offer: "Offer",
    addOffer: "Add Offer",
    languageCode: "Language Code",
    nativeName: "Native Name",
    flagCode: "Flag Code (e.g. tz)",
    confirmDelete: "Are you sure you want to delete this item?",
    deleteWarning: "This action cannot be undone.",
    noData: "No data available",
    loading: "Loading...",
    saving: "Saving...",
    success: "Success",
    error: "Error",
    selectLanguage: "Select language",
    documentType: "Document Type",
    customFileName: "Custom File Name (optional)",
    oldPassword: "Current Password",
    role: "Role",
    user: "User",
    admin: "Admin",
  },

  sw: {
    // Navbar
    home: "Nyumbani",
    services: "Huduma",
    documentation: "Nyaraka",
    posters: "Mabango",
    adminPortal: "Admin",

    // Auth
    adminLogin: "Ingia Akaunti",
    adminLoginDesc: "Ingia kufikia dashibodi ya usimamizi",
    username: "Barua pepe",
    password: "Nywila",
    login: "Ingia",
    logout: "Toka",
    invalidCredentials: "Barua pepe au nywila si sahihi. Jaribu tena.",
    backToHome: "Rudi Nyumbani",
    forgotPassword: "Umesahau Nywila?",
    sendOtp: "Tuma Msimbo",
    verifyOtp: "Thibitisha Msimbo",
    resetPassword: "Weka Nywila Mpya",
    enterOtp: "Ingiza OTP ya tarakimu 6",
    newPassword: "Nywila Mpya",
    confirmPassword: "Thibitisha Nywila",

    // Service Request Form
    serviceRequest: "Ombi la Huduma",
    serviceRequestDesc: "Jaza fomu hapa chini na timu yetu ya wataalamu itakujibu haraka.",
    backToServices: "Rudi Huduma",
    selectedService: "Chagua Huduma",
    firstName: "Jina la Kwanza",
    lastName: "Jina la Mwisho",
    fullName: "Jina Kamili",
    companyName: "Jina la Kampuni",
    workEmail: "Barua Pepe",
    emailAddress: "Barua Pepe",
    phoneNumber: "Nambari ya Simu",
    phone: "Simu (mfano: 255712345678)",
    projectDetails: "Ujumbe",
    projectPlaceholder: "Eleza hali yako ya kodi au unachohitaji msaada...",
    supportingDocs: "Nyaraka za Ziada",
    clickUpload: "Bonyeza kupakia au buruta hapa",
    fileTypes: "PDF, XLSX, DOC, PNG, JPG (max 20MB)",
    submitSecure: "Tuma Ombi",
    encryptedNote: "Taarifa yako inalindwa na usiri mkali.",
    optional: "si lazima",

    // Services Page
    expertTaxServices: "Huduma za Kodi za Wataalamu",
    servicesPageDesc: "Ushauri wa kodi kamili ulioboreshwa kwa biashara na mahitaji yako binafsi.",
    newFeature: "Kipengele Kipya",
    smartDiagnostic: "Tathmini Mahiri ya Kodi",
    diagnosticDesc: "Jibu maswali machache na upate mapendekezo ya kodi yanayokufaa.",
    runDiagnostic: "Fanya Tathmini",
    incomeQuestion: "Chanzo chako kikuu cha mapato ni kipi?",
    w2Employment: "Mshahara / Ajira",
    businessOwner: "Mmiliki wa Biashara",
    investmentsCapital: "Uwekezaji & Faida za Mtaji",
    continueBtn: "Endelea",
    readyGetStarted: "Uko tayari kuanza?",
    readyDesc: "Wasiliana na washauri wetu kwa ushauri wa kibinafsi.",
    directLine: "Simu ya Moja kwa Moja",
    emailSupport: "Msaada wa Barua Pepe",
    fullNameLabel: "Jina Kamili",
    selectServiceShort: "Chagua huduma",
    additionalInfo: "Taarifa za Ziada",
    submitRequest: "Tuma Ombi",
    secureNote: "🔒 Taarifa yako ni salama kabisa na ya siri",
    corporateTax: "Upangaji wa Kodi ya Kampuni",

    // Posters Page
    postersTitle: "Mabango & Rasilimali",
    postersPageDesc: "Pakua miongozo ya kodi, picha za kuelimisha na vifaa vya elimu.",
    download: "Pakua",
    preview: "Angalia",

    // Documentation Page
    docTitle: "Maktaba ya Nyaraka",
    docDesc: "Pakua fomu za kodi, miongozo ya uzingatifu na vifaa vya elimu.",
    searchDocs: "Tafuta nyaraka...",
    categories: "Makundi",

    // Admin
    dashboard: "Muhtasari wa Dashibodi",
    contentPosters: "Maudhui & Mabango",
    serviceRequests: "Maombi ya Huduma",
    settings: "Mipangilio",
    languages: "Lugha",
    servicesManagement: "Huduma",
    documentsManagement: "Nyaraka",
    usersManagement: "Watumiaji",
    totalRequests: "Maombi Yote",
    publishedPages: "Huduma Zinazofanya Kazi",
    postersUploaded: "Mabango Yaliyopakiwa",
    activeLanguages: "Lugha Zinazofanya Kazi",
    viewLiveSite: "Tazama Tovuti",
    addNew: "Ongeza Mpya",
    edit: "Hariri",
    delete: "Futa",
    save: "Hifadhi",
    cancel: "Ghairi",
    status: "Hali",
    active: "Inafanya Kazi",
    inactive: "Haifanyi Kazi",
    actions: "Vitendo",
    name: "Jina",
    title: "Kichwa",
    description: "Maelezo",
    uploadFile: "Pakia Faili",
    uploadImage: "Pakia Picha",
    translations: "Tafsiri",
    addTranslation: "Ongeza Tafsiri",
    offer: "Huduma",
    addOffer: "Ongeza Huduma",
    languageCode: "Msimbo wa Lugha",
    nativeName: "Jina la Asili",
    flagCode: "Msimbo wa Bendera (mfano: tz)",
    confirmDelete: "Una uhakika unataka kufuta hili?",
    deleteWarning: "Kitendo hiki hakiwezi kurudishwa.",
    noData: "Hakuna data",
    loading: "Inapakia...",
    saving: "Inahifadhi...",
    success: "Mafanikio",
    error: "Hitilafu",
    selectLanguage: "Chagua lugha",
    documentType: "Aina ya Hati",
    customFileName: "Jina la Faili (si lazima)",
    oldPassword: "Nywila ya Sasa",
    role: "Jukumu",
    user: "Mtumiaji",
    admin: "Msimamizi",
  },

  zh: {
    home: "首页",
    services: "服务",
    documentation: "文档",
    posters: "海报",
    adminPortal: "管理入口",
    adminLogin: "管理员登录",
    adminLoginDesc: "登录以访问TaxProConsult管理后台",
    username: "电子邮件",
    password: "密码",
    login: "登录",
    logout: "退出",
    invalidCredentials: "邮箱或密码不正确，请重试。",
    backToHome: "返回首页",
    serviceRequest: "提交服务请求",
    serviceRequestDesc: "填写下表，我们的专家团队将及时回复。",
    backToServices: "返回服务页",
    selectedService: "选择服务",
    firstName: "名",
    lastName: "姓",
    fullName: "全名",
    workEmail: "电子邮件",
    emailAddress: "电子邮件",
    phoneNumber: "电话号码",
    phone: "电话 (例如: 255712345678)",
    projectDetails: "留言",
    projectPlaceholder: "请描述您的税务情况或需要的帮助...",
    submitSecure: "提交请求",
    encryptedNote: "您的信息经过加密，受到严格保密保护。",
    optional: "可选",
    postersTitle: "海报与资源",
    postersPageDesc: "下载税务指南、信息图和教育材料。",
    download: "下载",
    preview: "预览",
    expertTaxServices: "专业税务服务",
    corporateTax: "企业税务规划",
    servicesPageDesc: "量身定制的全面税务咨询。",
    readyGetStarted: "准备好开始了吗？",
    readyDesc: "联系我们的顾问进行个性化咨询。",
    directLine: "直线电话",
    emailSupport: "邮件支持",
    selectServiceShort: "选择服务",
    additionalInfo: "补充信息",
    submitRequest: "提交请求",
    secureNote: "🔒 您的信息100%安全保密",
    docTitle: "文档与资源库",
    docDesc: "下载税务表格、合规指南和教育材料。",
    searchDocs: "搜索文档...",
    categories: "文档类别",
    loading: "加载中...",
    addNew: "新增",
    edit: "编辑",
    delete: "删除",
    save: "保存",
    cancel: "取消",
    noData: "暂无数据",
    status: "状态",
    active: "活跃",
    inactive: "非活跃",
    actions: "操作",
    name: "名称",
    title: "标题",
    description: "描述",
    uploadFile: "上传文件",
    uploadImage: "上传图片",
    translations: "翻译",
    addTranslation: "添加翻译",
    offer: "服务项目",
    addOffer: "添加服务项目",
    languageCode: "语言代码",
    nativeName: "本地名称",
    flagCode: "国旗代码 (例如: cn)",
    confirmDelete: "确定要删除此项目吗？",
    noData: "暂无数据",
    selectLanguage: "选择语言",
    documentType: "文档类型",
    customFileName: "自定义文件名（可选）",
    role: "角色",
    user: "用户",
    admin: "管理员",
    dashboard: "仪表盘",
    serviceRequests: "服务请求",
    languages: "语言管理",
    servicesManagement: "服务管理",
    documentsManagement: "文档管理",
    usersManagement: "用户管理",
    contentPosters: "海报管理",
    totalRequests: "总请求数",
    publishedPages: "活跃服务",
    postersUploaded: "已上传海报",
    activeLanguages: "活跃语言",
  },
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(
    () => localStorage.getItem("app_locale") || "en"
  );

  // Fetch available languages from API so we can expose them for forms, etc.
  const { data: apiLanguages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      try {
        const res = await languagesApi.list();
        return res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const setLang = useCallback((code) => {
    setLangState(code);
  }, []);

  useEffect(() => {
    localStorage.setItem("app_locale", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key) => {
      return (
        uiTranslations?.[lang]?.[key] ||
        uiTranslations.en?.[key] ||
        key
      );
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      language: lang,
      setLang,
      t,
      apiLanguages: apiLanguages || [],
    }),
    [lang, setLang, t, apiLanguages]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);