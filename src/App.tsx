// Version: 6.1.1 - Fix ReferenceError & Render Issues
// @ts-nocheck
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, deleteDoc, doc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  MapPin, Camera, Calendar, Wallet, BookOpen, 
  Sun, Cloud, ChevronRight, Navigation, 
  Plus, Trash2, X, CheckSquare,
  Sunset, ArrowRightLeft, Clock, Map as MapIcon, Car,
  AlertTriangle, Info, Edit3, ArrowLeft, Image as ImageIcon,
  Phone, Home, List, Languages, ExternalLink, Maximize2, LocateFixed, ChevronDown, Droplets,
  Utensils, ShoppingBag, Hotel, CloudRain, Pencil, Printer, FileText
} from 'lucide-react';

// --- 1. Firebase 初始化 ---
let app, auth, db;
const appId = 'default-app-id';
let globalIsLocalMode = false;

try {
  // @ts-ignore
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    // @ts-ignore
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    throw new Error("Local Mode");
  }
} catch (e) {
  console.log("啟動本機預覽模式");
  globalIsLocalMode = true;
}

// --- 2. 資料設定 ---
const WORLD_CITIES = [
  { name: '台北', tz: 'Asia/Taipei', lat: 25.0330, lon: 121.5654 },
  { name: '東京', tz: 'Asia/Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: '大阪', tz: 'Asia/Tokyo', lat: 34.6937, lon: 135.5023 },
  { name: '首爾', tz: 'Asia/Seoul', lat: 37.5665, lon: 126.9780 },
  { name: '曼谷', tz: 'Asia/Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: '新加坡', tz: 'Asia/Singapore', lat: 1.3521, lon: 103.8198 },
  { name: '倫敦', tz: 'Europe/London', lat: 51.5074, lon: -0.1278 },
  { name: '紐約', tz: 'America/New_York', lat: 40.7128, lon: -74.0060 },
  { name: '巴黎', tz: 'Europe/Paris', lat: 48.8566, lon: 2.3522 },
  { name: '雪梨', tz: 'Australia/Sydney', lat: -33.8688, lon: 151.2093 },
];

const INITIAL_INFO = {
  mapcodes: [
    { id: 1, name: "DMM 水族館", code: "232 544 542*25" },
    { id: 2, name: "OTS 租車 (豐崎)", code: "232 543 502*82" },
    { id: 3, name: "沖繩世界 (玉泉洞)", code: "232 495 330*28" },
    { id: 4, name: "美國村", code: "33 526 450*63" },
    { id: 5, name: "美麗海水族館", code: "553 075 797*77" },
    { id: 6, name: "知念岬公園", code: "232 594 503*30" },
    { id: 7, name: "COSTCO 南城", code: "232 466 363*88" },
    { id: 8, name: "沖繩兒童王國", code: "33 561 573*06" },
    { id: 9, name: "中城公園", code: "33 410 668*52" },
    { id: 10, name: "名護鳳梨園", code: "206 714 459*35" },
    { id: 11, name: "備瀨福木林道", code: "553 105 654*77" },
    { id: 12, name: "PARCO CITY", code: "33 339 036*63" },
    { id: 13, name: "瀨長島", code: "33 002 602*06" },
    { id: 14, name: "Ashibinaa Outlet", code: "232 544 452*22" }
  ],
  japanese: [
    { id: 1, ch: '謝謝', jp: 'ありがとう (Arigatou)' },
    { id: 2, ch: '廁所在哪裡?', jp: 'トイレはどこですか?' },
    { id: 3, ch: '請給我水', jp: 'お水をください' },
    { id: 4, ch: '這個多少錢?', jp: 'いくらですか？' },
    { id: 5, ch: '不要蔥', jp: 'ネギ抜きで' },
  ],
  emergency: [
    { id: 1, name: '警察局', tel: '110' },
    { id: 2, name: '火警/救護車', tel: '119' },
    { id: 3, name: '外交部緊急聯絡', tel: '080-3557-9110' },
    { id: 4, name: 'GCL 租車公司', tel: '098-851-4470' },
  ],
  checklist: [
    { id: 1, text: '護照 (有效期6個月以上)' },
    { id: 2, text: '駕照 (台灣駕照+日文譯本)' },
    { id: 3, text: '網卡 / 漫遊開通' },
    { id: 4, text: '行動電源 + 充電線' },
    { id: 5, text: '暈車藥 / 常備藥' },
    { id: 6, text: '雨具 (摺疊傘)' }
  ],
  accommodation: [
    { 
      id: 1,
      name: 'Glory island okinawa -SOBE-', 
      address: '那覇市壺川...', 
      tel: '098-863-7777',
      note: '密碼: 1234',
      link: 'https://tw.hotels.com/ho2670247488/glory-island-okinawa-sobe-di-ke-si-ke-fu-jia-na/'
    },
    { 
      id: 2,
      name: 'Family Condo Chatan Hills', 
      address: '北谷町...', 
      tel: '098-926-1010',
      note: '含早餐',
      link: 'https://www.google.com/url?url=https%3A%2F%2Fsunrest-resort.com%2Ffacility%2Fthehotelchatan%2F'
    },
    { 
      id: 3,
      name: 'Private Condo Chatan Jagaru', 
      address: '北谷町...', 
      tel: '098-xxx-xxxx',
      note: '有廚房',
      link: 'https://tw.hotels.com/ho1918159776/private-condo-chatan-jagaru-by-coldio-premium-bei-gu-ri-ben/'
    },
  ]
};

const INITIAL_ITINERARY = [
  {
    date: '12/4',
    day: '週四',
    fullDate: '2025/12/04',
    location: '台北 ➔ 沖繩',
    events: [
      { id: 'd1-1', time: '16:00', title: '抵達桃園 T1', location: '桃園機場', travelTime: '50分', image: '/images/day1_1.png', desc: '要準備好護照。' },
      { id: 'd1-2', time: '18:20', title: '樂桃 MM930 起飛', location: '桃園機場', travelTime: '等待', image: '/images/day1_2.jpg', desc: '飛往那霸機場-飛行時間90分鐘' },
      { id: 'd1-3', time: '20:50', title: '抵達那霸機場', location: '那霸機場', travelTime: '飛行 90分', image: '/images/day1_4.png' },
      { id: 'd1-4', time: '21:10', title: '出境', location: '那霸機場', image: '/images/day1_5.png', desc: '準備好入境資料QR Code' },
      { id: 'd1-5', time: '21:30', title: '搭乘單軌電車', location: '那覇空港駅', travelTime: '電車 10分', image: '/images/day1_6.png', desc: `坐往壺川站\n票價:\n大人: 290\n小孩: 150` },
      { id: 'd1-6', time: '21:55', title: '入住飯店', location: 'Glory island okinawa -SOBE-', travelTime: '步行 15分', image: '/images/day1_7.png', desc: 'Hotels.com 行程編號：73305401005050', introImages: ['/images/day1_7.png'] },
    ]
  },
  {
    date: '12/5',
    day: '週五',
    fullDate: '2025/12/05',
    location: '南部觀光',
    events: [
      { id: 'd2-1', time: '07:30', title: '吃早餐', location: 'Glory island okinawa -SOBE-', image: '/images/day2_1.png' },
      { id: 'd2-2', time: '08:20', title: 'GCL 領車', location: 'GCL Rental', type: '步行 15分+電車 10分', image: '/images/day2_2.png', desc: `GCL領車 (カーレンタルのグッドカーライフ)\nGCL-251129-035749 Mitsubishi Eclipse Cross BLACK Edition\nGCL-251129-035748 Toyota YARIS Cross` },
      { id: 'd2-3', time: '09:20', title: 'DMM 水族館', location: 'iias 沖繩豐崎', travelTime: '車程 20分', image: '/images/day2_3.png', desc: `DMM 營業時間 09:00〜19:00\nariyushi水族館是一座位於沖繩縣「豐見城」市的大型商業設施「iias沖繩豐崎」內的體驗型水族館。` },
      { id: 'd2-4', time: '12:00', title: '午餐', location: 'iias 沖繩豐崎', image: '/images/day2_4.png' },
      { id: 'd2-5', time: '13:30', title: '平和祈念公園', location: '平和祈念公園-兒童樂園', travelTime: '車程 21分', image: '/images/day2_5.png', desc: `營業時間 09:00〜19:00` },
      { id: 'd2-6', time: '14:00', title: '玉泉洞', location: 'Okinawa World', travelTime: '車程 12分', image: '/images/day2_6.png', desc: `9:00-17:30\n下午表演時間\nSUPER EISA太鼓舞 14:30` },
      { id: 'd2-7', time: '16:00', title: '中本天婦羅店', location: '中本天婦羅店', travelTime: '車程10分', image: '/images/day2_7.png' },
      { id: 'd2-8', time: '16:40', title: '知念岬公園', location: '知念岬公園', travelTime: '車程20分', image: '/images/day2_8.png', desc: '海濱公園與漫步區' },
      { id: 'd2-9', time: '18:00', title: 'COSTCO 晚餐', location: 'Costco Nanjo', travelTime: '車程 20分', image: '/images/day2_9.png', desc: '好市多' },
      { id: 'd2-10', time: '20:30', title: '回飯店', location: 'Family Condo Chatan Hills', travelTime: '車程 40分', image: '/images/day2_10.png' },
    ]
  },
  {
    date: '12/6',
    day: '週六',
    fullDate: '2025/12/06',
    location: '中部遊玩',
    events: [
      { id: 'd3-1', time: '07:30', title: '吃早餐', location: 'Family Condo Chatan Hills', image: '/images/day3_1.png' },
      { id: 'd3-2', time: '09:30', title: '沖繩兒童樂園', location: 'Okinawa Zoo', travelTime: '車程 15分', image: '/images/day3_2.png', desc: '沖繩兒童王國' },
      { id: 'd3-3', time: '12:00', title: '海族工房', location: '海族工房', travelTime: '車程 5分', image: '/images/day3_3.png' },
      { id: 'd3-4', time: '13:30', title: '永旺夢樂城', location: 'AEON MALL Rycom', travelTime: '車程 10分', image: '/images/day3_4.png' },
      { id: 'd3-5', time: '14:00', title: '中城公園', location: '中城公園', travelTime: '車程 15分', image: '/images/day3_4_1.png', desc: `沖繩縣內最大的中城公園` },
      { id: 'd3-6', time: '17:00', title: '迴轉壽司市場', location: 'グルメ回転寿司市場 美浜店', travelTime: '車程 10分', image: '/images/day3_5.png' },
      { id: 'd3-7', time: '19:20', title: '美國村煙火', location: 'American Village', travelTime: '步行 10分', image: '/images/day3_6.png', desc: `坐落於沖繩中部・美濱` },
      { id: 'd3-8', time: '21:00', title: '回飯店', location: 'Family Condo Chatan Hills', travelTime: '車程 15分', image: '/images/day3_7.png' },
    ]
  },
  {
    date: '12/7',
    day: '週日',
    fullDate: '2025/12/07',
    location: '北部探險',
    events: [
      { id: 'd4-1', time: '07:30', title: '吃早餐', location: 'Family Condo Chatan Hills', image: '/images/day4_1.png' },
      { id: 'd4-2', time: '09:00', title: '名護鳳梨園', location: 'Nago Pineapple Park', travelTime: '車程 60分', image: '/images/day4_2.png', desc: `營業時間 10：00~18：00` },
      { id: 'd4-3', time: '11:30', title: '百年古家 大家', location: 'Ufuya', travelTime: '車程 15分', image: '/images/day4_3.png' },
      { id: 'd4-4', time: '13:30', title: '美麗海水族館', location: 'Churaumi Aquarium', travelTime: '車程 20分', image: '/images/day4_4_1.png', desc: '海豚表演時間：13:00 / 15:00' },
      { id: 'd4-5', time: '17:00', title: '備瀨福木林道', location: 'Bise Fukugi Tree Road', travelTime: '車程 10分', image: '/images/day4_5.png' },
      { id: 'd4-6', time: '18:00', title: '晚餐', location: '', travelTime: '車程 20分', image: '/images/day4_6.png' },
      { id: 'd4-7', time: '20:30', title: '回飯店', location: 'Private Condo Chatan Jagaru', travelTime: '車程 60分', image: '/images/day4_7.png' },
    ]
  },
  {
    date: '12/8',
    day: '週一',
    fullDate: '2025/12/08',
    location: '放電行程',
    events: [
      { id: 'd5-1', time: '07:30', title: '吃早餐', location: 'Private Condo Chatan Jagaru', image: '/images/day5_1.png' },
      { id: 'd5-2', time: '09:00', title: 'PARCO CITY', location: 'PARCO CITY', travelTime: '車程 30分', image: '/images/day5_2.png' },
      { id: 'd5-3', time: '13:00', title: '浦添大公園', location: 'Urasoe Grand Park', travelTime: '車程 20分', image: '/images/day5_4.png' },
      { id: 'd5-4', time: '17:00', title: '東南植物樂園', location: 'Southeast Botanical Gardens', travelTime: '車程 40分', image: '/images/day5_5.png', desc: `東南植物樂園的夜間燈光秀` },
      { id: 'd5-5', time: '19:00', title: '晚餐', location: 'Private Condo Chatan Jagaru', travelTime: '車程 20分', image: '/images/day4_6.png' },
    ]
  },
  {
    date: '12/9',
    day: '週二',
    fullDate: '2025/12/09',
    location: '回程',
    events: [
      { id: 'd6-1', time: '07:30', title: '吃早餐', location: 'Private Condo Chatan Jagaru', image: '/images/day6_1.png' },
      { id: 'd6-2', time: '08:30', title: '瀨長島', location: 'Umikaji Terrace', travelTime: '車程 50分', image: '/images/day6_2.png' },
      { id: 'd6-3', time: '12:30', title: 'ASHIBINAA Outlet', location: 'Outlet Mall Ashibinaa', travelTime: '車程 15分', image: '/images/day6_3.png' },
      { id: 'd6-4', time: '15:00', title: '還車 & 去機場', location: 'Naha Airport', travelTime: '車程 15分', image: '/images/day6_4.png' },
    ]
  },
];

const WeatherIcon = ({ code }) => {
  if (code <= 3) return <Sun className="w-8 h-8 text-orange-500" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8 text-blue-500" />;
  return <Cloud className="w-8 h-8 text-blue-400" />;
};

export default function OkinawaTravelApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0); 
  const [isLocalMode, setIsLocalMode] = useState(globalIsLocalMode); 
  
  // Dashboard & Weather
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [localWeather, setLocalWeather] = useState({ temp: '--', code: 0, name: '定位中...', hum: '--' });
  const [localHourly, setLocalHourly] = useState([]);
  const [targetCityWeather, setTargetCityWeather] = useState({ temp: '--', code: 0, name: '台北', hum: '--' });
  const [targetHourly, setTargetHourly] = useState([]);
  const [currentLocationName, setCurrentLocationName] = useState('LOCAL');

  // Rates
  const [jpyRate, setJpyRate] = useState(0.215); 
  const [calcAmount, setCalcAmount] = useState('');

  // Modals Control
  const [showDiary, setShowDiary] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [showAccommodation, setShowAccommodation] = useState(false); 
  const [showEventDetail, setShowEventDetail] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false); 
  const [showPrintView, setShowPrintView] = useState(false); 
  const [fullscreenImage, setFullscreenImage] = useState(null); 
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // Tab State
  const [infoTab, setInfoTab] = useState('mapcodes');
  const [selectedTimeCity, setSelectedTimeCity] = useState(WORLD_CITIES[0]);
  const [selectedWeatherCity, setSelectedWeatherCity] = useState(WORLD_CITIES[0]);

  // Lists Data (State)
  const [itineraryData, setItineraryData] = useState(INITIAL_ITINERARY);
  const [infoData, setInfoData] = useState(INITIAL_INFO);
  const [budgets, setBudgets] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [moments, setMoments] = useState([]);
  const [foodList, setFoodList] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [customEvents, setCustomEvents] = useState([]); 

  // Header Image
  const [headerImage, setHeaderImage] = useState('https://images.unsplash.com/photo-1465804684098-9b7f79317257?auto=format&fit=crop&w=1000&q=80');

  // Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newDiaryText, setNewDiaryText] = useState('');
  const [diaryImage, setDiaryImage] = useState(null);
  const [budgetImage, setBudgetImage] = useState(null);
  const [newEventImage, setNewEventImage] = useState(null);
  
  // New Inputs for Food/Shop/Accom
  const [foodImage, setFoodImage] = useState(null);
  const [shopImage, setShopImage] = useState(null);
  const [newAccom, setNewAccom] = useState({ name: '', address: '', tel: '', note: '', link: '' });
  const [isEditingAccom, setIsEditingAccom] = useState(false);
  const [editingAccomId, setEditingAccomId] = useState(null);

  // Edit Event State
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Info Inputs
  const [newInfoInput, setNewInfoInput] = useState({}); 
  const [newFood, setNewFood] = useState({ name: '', address: '', note: '' });
  const [newShop, setNewShop] = useState({ item: '', shop: '', note: '' });
  const [newEvent, setNewEvent] = useState({ time: '', title: '', location: '', desc: '' });

  // --- Helpers ---
  const handleImageUpload = (e, setFn) => {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => setFn(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- Itinerary Management ---
  const handleDeleteEvent = (dayDate, eventId) => {
    const newData = itineraryData.map(day => {
      if (day.date === dayDate) {
        return { ...day, events: day.events.filter(e => e.id !== eventId) };
      }
      return day;
    });
    setItineraryData(newData);
  };

  const handleEditEvent = (event) => {
    setNewEvent({
      time: event.time,
      title: event.title,
      location: event.location,
      desc: event.desc || ''
    });
    setNewEventImage(event.image);
    setIsEditingEvent(true);
    setEditingEventId(event.id);
    setShowAddEvent(true);
  };

  const handleSaveEvent = () => {
    if(!newEvent.time || !newEvent.title) return;
    const currentDayDate = itineraryData[activeTab].date;
    
    const eventData = {
      time: newEvent.time,
      title: newEvent.title,
      location: newEvent.location || '自訂地點',
      desc: newEvent.desc || '',
      image: newEventImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
      travelTime: '自訂'
    };

    const newData = itineraryData.map(day => {
      if (day.date === currentDayDate) {
        let updatedEvents;
        if (isEditingEvent) {
          // Update existing
          updatedEvents = day.events.map(ev => ev.id === editingEventId ? { ...ev, ...eventData } : ev);
        } else {
          // Add new
          const newEventObj = { id: Date.now().toString(), ...eventData };
          updatedEvents = [...day.events, newEventObj];
        }
        // Sort by time
        return { ...day, events: updatedEvents.sort((a, b) => a.time.localeCompare(b.time)) };
      }
      return day;
    });

    setItineraryData(newData);
    
    // Reset
    setNewEvent({ time: '', title: '', location: '', desc: '' });
    setNewEventImage(null);
    setIsEditingEvent(false);
    setEditingEventId(null);
    setShowAddEvent(false);
  };

  const handleAddIntroImage = (imgFile) => {
    if (!imgFile || !showEventDetail) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImg = reader.result;
      const newData = itineraryData.map(day => ({
        ...day,
        events: day.events.map(ev => {
          if (ev.id === showEventDetail.id) {
             const updated = { ...ev, introImages: [...(ev.introImages || []), newImg] };
             setShowEventDetail(updated); 
             return updated;
          }
          return ev;
        })
      }));
      setItineraryData(newData);
    };
    reader.readAsDataURL(imgFile);
  };

  const handleDeleteInfo = (category, id) => {
    setInfoData({ ...infoData, [category]: infoData[category].filter(item => item.id !== id) });
  };

  const handleAddInfo = (category) => {
    const input = newInfoInput[category];
    if (!input) return;
    const newItem = { id: Date.now(), ...input };
    setInfoData({ ...infoData, [category]: [...infoData[category], newItem] });
    setNewInfoInput({ ...newInfoInput, [category]: {} });
  };

  const handleAddFood = () => {
    if(!newFood.name) return;
    setFoodList([...foodList, { id: Date.now(), ...newFood, image: foodImage }]);
    setNewFood({ name: '', address: '', note: '' });
    setFoodImage(null);
  };
  const handleDeleteFood = (id) => setFoodList(foodList.filter(i => i.id !== id));

  const handleAddShop = () => {
    if(!newShop.item) return;
    setShoppingList([...shoppingList, { id: Date.now(), ...newShop, image: shopImage }]);
    setNewShop({ item: '', shop: '', note: '' });
    setShopImage(null);
  };
  const handleDeleteShop = (id) => setShoppingList(shoppingList.filter(i => i.id !== id));

  const handleAddOrUpdateAccom = () => {
    if(!newAccom.name) return;
    if (isEditingAccom) {
       setInfoData({ ...infoData, accommodation: infoData.accommodation.map(item => item.id === editingAccomId ? { ...item, ...newAccom } : item) });
       setIsEditingAccom(false);
       setEditingAccomId(null);
    } else {
       setInfoData({ ...infoData, accommodation: [...infoData.accommodation, { id: Date.now(), ...newAccom }] });
    }
    setNewAccom({ name: '', address: '', tel: '', note: '', link: '' });
  };
  const handleDeleteAccom = (id) => {
    setInfoData({ ...infoData, accommodation: infoData.accommodation.filter(i => i.id !== id) });
  };
  const handleEditAccom = (accom) => {
    setNewAccom(accom);
    setIsEditingAccom(true);
    setEditingAccomId(accom.id);
    setShowAccommodation(true); // Ensure modal is open
  };

  const handleDeleteMoment = async (id) => {
    if (isLocalMode || !user) {
       setMoments(moments.filter(m => m.id !== id));
       return;
    }
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'moments', id)); } catch (e) {}
  };

  const handleAddBudget = async () => {
    if (!newItemName || !newItemCost) return;
    const data = { item: newItemName, cost: Number(newItemCost), image: budgetImage, createdAt: serverTimestamp(), userId: user?.uid || 'local' };
    if (isLocalMode || !user) { 
       setBudgets([ {id: Date.now().toString(), ...data}, ...budgets]); 
       setNewItemName(''); setNewItemCost(''); setBudgetImage(null); 
       return; 
    }
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'budget'), data); setNewItemName(''); setNewItemCost(''); setBudgetImage(null); } catch(e) { setIsLocalMode(true); }
  };
  
  const handleDeleteBudget = async (id) => {
    if (isLocalMode || !user) { setBudgets(budgets.filter(b => b.id !== id)); return; }
    try { deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget', id)); } catch (e) {}
  };
  
  const handleAddDiary = async () => {
    if (!newDiaryText && !diaryImage) return;
    const data = { text: newDiaryText, image: diaryImage, createdAt: serverTimestamp(), date: new Date().toLocaleDateString() };
    if (isLocalMode || !user) { setDiaries([ {id: Date.now(), ...data}, ...diaries]); setNewDiaryText(''); setDiaryImage(null); return; }
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'diary'), data); setNewDiaryText(''); setDiaryImage(null); } catch(e) { setIsLocalMode(true); }
  };

  const handleAddMoment = async (title) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if(file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const data = { eventTitle: title, image: reader.result, createdAt: serverTimestamp() };
          if (isLocalMode || !user) { setMoments([{id: Date.now(), ...data}, ...moments]); return; }
          try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'moments'), data); } catch(e) { setIsLocalMode(true); }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // --- Effects (Time, Weather, Auth) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Simple format for dashboard clock
      setCurrentTime(now.toLocaleTimeString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''));
      setCurrentDateStr(now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));
      
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setCurrentLocationName(tz.split('/')[1].replace('_', ' ').toUpperCase());
    }, 1000);

    const fetchWeather = (lat, lon, setter, hourlySetter, name) => {
        // Add state: setTargetHourly
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=2`)
          .then(res => res.json())
          .then(data => {
            if(data.current) {
              setter({ 
                temp: data.current.temperature_2m, 
                hum: data.current.relative_humidity_2m,
                code: data.current.weather_code, 
                name: name
              });
            }
            if(data.hourly && hourlySetter) {
               const currentHour = new Date().getHours();
               const next24 = [];
               for(let i=0; i<24; i++) {
                  const idx = i + currentHour; 
                  if (data.hourly.time[idx]) {
                    next24.push({
                      time: data.hourly.time[idx].slice(11, 16),
                      temp: data.hourly.temperature_2m[idx],
                      code: data.hourly.weather_code[idx],
                      rain: data.hourly.precipitation_probability[idx]
                    });
                  }
               }
               hourlySetter(next24);
            }
          })
          .catch(e => console.warn("Weather err", e));
      };
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, setLocalWeather, setLocalHourly, "目前位置"),
          () => setLocalWeather({ temp: '--', hum: '--', code: 0, name: 'GPS OFF' })
        );
      }
      fetchWeather(selectedWeatherCity.lat, selectedWeatherCity.lon, setTargetCityWeather, setTargetHourly, selectedWeatherCity.name);
      
      // Rate
      fetch('https://api.frankfurter.app/latest?from=JPY&to=TWD')
      .then(res => res.json())
      .then(d => { if(d.rates?.TWD) setJpyRate(d.rates.TWD); }).catch(() => {});

    return () => clearInterval(timer);
  }, [selectedWeatherCity]);

  useEffect(() => {
    const initAuth = async () => {
      if (!isLocalMode && auth && typeof signInAnonymously === 'function') {
        try { await signInAnonymously(auth); } 
        catch (e) { console.warn("Auth check: local mode"); setIsLocalMode(true); }
      }
    };
    initAuth();
    if (!isLocalMode && auth) return onAuthStateChanged(auth, setUser);
    else setUser({ uid: 'local-user' });
  }, [isLocalMode]);

  useEffect(() => {
    if (!user || isLocalMode || !db) return;
    const handleError = (err) => {
      if (err.code === 'permission-denied' || err.code === 'unavailable') {
        console.warn("DB access denied, local mode.");
        setIsLocalMode(true);
      }
    };
    const qBudget = query(collection(db, 'artifacts', appId, 'public', 'data', 'budget'), orderBy('createdAt', 'desc'));
    const unsubBudget = onSnapshot(qBudget, (snap) => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleError);
    const qDiary = query(collection(db, 'artifacts', appId, 'public', 'data', 'diary'), orderBy('createdAt', 'desc'));
    const unsubDiary = onSnapshot(qDiary, (snap) => setDiaries(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleError);
    const qMoments = query(collection(db, 'artifacts', appId, 'public', 'data', 'moments'), orderBy('createdAt', 'desc'));
    const unsubMoments = onSnapshot(qMoments, (snap) => setMoments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleError);
    const qEvents = query(collection(db, 'artifacts', appId, 'public', 'data', 'itinerary_events'));
    const unsubEvents = onSnapshot(qEvents, (snap) => setCustomEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleError);
    return () => { unsubBudget(); unsubDiary(); unsubMoments(); unsubEvents(); };
  }, [user, isLocalMode]);

  const totalCost = useMemo(() => budgets.reduce((a, c) => a + c.cost, 0), [budgets]);

  const displayEvents = useMemo(() => {
    const staticEvents = itineraryData[activeTab].events;
    const currentDayDate = itineraryData[activeTab].date;
    const dynamicEvents = customEvents.filter(e => e.date === currentDayDate);
    return [...staticEvents, ...dynamicEvents].sort((a, b) => a.time.localeCompare(b.time));
  }, [activeTab, itineraryData, customEvents]);

  // --- UI ---
  return (
    <div className="min-h-screen font-sans pb-40 bg-gray-50">
      
      {/* Header (Image Only) */}
      <div 
        className="relative h-48 bg-cover bg-center shadow-md"
        style={{ 
          backgroundImage: `url('${headerImage}')`,
        }}
      >
         <div className="absolute inset-0 bg-black/20"></div>
         
         <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-20 pt-[max(2rem,env(safe-area-inset-top))]">
            <div>
               <div className="text-white/90 text-xs font-bold tracking-[0.2em] mb-1 uppercase shadow-sm">Family Trip</div>
               <h1 className="text-3xl font-black text-white drop-shadow-lg tracking-wide">2025 沖繩之旅</h1>
               <p className="text-white/90 font-medium mt-1 text-sm flex items-center"><Calendar className="w-3 h-3 mr-1"/> 2025/12/4 - 12/9</p>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowPrintView(true)} className="bg-white/20 backdrop-blur-md p-2 rounded-full cursor-pointer hover:bg-white/40 transition border border-white/30 shadow-lg text-white">
                  <Printer className="w-5 h-5"/>
               </button>
               <label className="bg-white/20 backdrop-blur-md p-2 rounded-full cursor-pointer hover:bg-white/40 transition border border-white/30 shadow-lg">
                  <Camera className="text-white w-5 h-5"/>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setHeaderImage)} />
               </label>
            </div>
         </div>
      </div>

      {/* Tabs (Updated Style: Month/Day, D#, Weekday) */}
      <div className="-mt-8 px-4 overflow-x-auto snap-x flex space-x-3 no-scrollbar pb-4 relative z-20">
        {itineraryData.map((item, index) => (
          <button 
            key={index} 
            onClick={() => setActiveTab(index)} 
            className={`snap-center flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 shadow-lg ${
              activeTab === index 
                ? 'bg-blue-600 text-white border-blue-600 scale-105' 
                : 'bg-white text-gray-500 border-white hover:bg-gray-50'
            }`}
          >
            <span className="text-[10px] font-medium opacity-90">{item.date}</span>
            <span className="text-2xl font-black leading-none my-0.5">D{index + 1}</span>
            <span className="text-[10px] font-bold">{item.day}</span>
          </button>
        ))}
      </div>

      {/* Dashboard (Restored Position & Layout) */}
      <div className="px-4 space-y-3 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          
          {/* Time Card (Left) */}
          <div onClick={() => setShowTimeModal(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-24 flex flex-col justify-center cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
               所在時間 ({currentLocationName})
            </div>
            <div className="text-2xl font-black text-gray-800 tracking-tighter font-mono leading-none">
               {currentTime}
            </div>
          </div>

          {/* Weather Card (Right) */}
          <div onClick={() => setShowWeatherModal(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-24 flex flex-col justify-center cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
             <div className="flex justify-between items-start mb-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">當地天氣 ({localWeather.name})</div>
                <WeatherIcon code={localWeather.code} />
             </div>
             <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black text-gray-800 tracking-tighter leading-none">{localWeather.temp}°</div>
                <div className="text-[10px] text-blue-400 font-bold flex items-center"><Droplets className="w-3 h-3 mr-0.5"/>{localWeather.hum}%</div>
             </div>
          </div>
        </div>

        {/* Exchange Rate (Full Width) */}
        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between h-16">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">¥</div>
              <ArrowRightLeft className="w-4 h-4 text-gray-300" />
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">NT</div>
           </div>
           <input 
              type="number" 
              placeholder="1000" 
              className="flex-1 bg-transparent text-right font-mono font-bold text-gray-700 text-xl outline-none mx-2"
              inputMode="decimal" 
              value={calcAmount} 
              onChange={(e) => setCalcAmount(e.target.value)}
           />
           <div className="text-blue-600 font-black font-mono text-xl min-w-[60px] text-right">
              ${((parseFloat(calcAmount) || 0) * jpyRate).toFixed(0)}
           </div>
        </div>
      </div>

      {/* Itinerary List */}
      <div className="px-2 mt-8 pb-10 overflow-hidden">
        <h2 className="text-sm font-bold text-gray-400 mb-4 pl-4 uppercase tracking-widest flex items-center gap-2">
           <Car className="w-4 h-4"/> 每日行程
        </h2>
        <div className="relative w-full max-w-md mx-auto space-y-12">
          {displayEvents.map((event, idx) => {
            const isLeft = idx % 2 !== 0; const hasNext = idx < displayEvents.length - 1;
            return (
              <div key={event.id} className={`relative flex items-center ${isLeft ? 'justify-start pl-2' : 'justify-end pr-2'}`}>
                {hasNext && (
                  <svg className="absolute top-1/2 left-0 w-full h-40 -z-10 pointer-events-none overflow-visible" style={{ top: '50%' }}>
                    <path d={!isLeft ? "M 75% 0 C 75% 50, 25% 50, 25% 100" : "M 25% 0 C 25% 50, 75% 50, 75% 100"} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
                    {event.travelTime && (<foreignObject x="0" y="35%" width="100%" height="30"><div className="flex justify-center"><div className="bg-white text-slate-500 text-[10px] px-2 py-1 rounded-full border border-slate-300 shadow-sm font-bold flex items-center"><Car className="w-3 h-3 mr-1"/> {event.travelTime}</div></div></foreignObject>)}
                  </svg>
                )}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-2 text-right' : 'left-2 text-left'} w-12`}><span className="font-bold text-slate-800 bg-white px-1 rounded font-mono text-sm block border border-gray-100 shadow-sm">{event.time}</span></div>
                
                <div className="relative w-[85%] h-56 rounded-[2rem] shadow-xl bg-white group z-10 flex flex-col overflow-hidden transition-all hover:shadow-2xl border border-gray-50">
                    <div className="absolute top-2 right-2 z-30 flex gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                        className="bg-white/80 p-1.5 rounded-full text-blue-500 shadow-sm hover:bg-blue-500 hover:text-white transition"
                       >
                        <Edit3 className="w-4 h-4"/>
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(itineraryData[activeTab].date, event.id); }}
                        className="bg-white/80 p-1.5 rounded-full text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition"
                       >
                        <Trash2 className="w-4 h-4"/>
                       </button>
                    </div>
                    <div className="h-[75%] w-full relative overflow-hidden" onClick={() => setShowEventDetail(event)}>
                        {event.image ? (<img src={event.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />) : (<div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><MapIcon className="w-12 h-12" /></div>)}
                    </div>
                    <div className="h-[25%] flex flex-col justify-center items-center bg-white relative z-10">
                      <div className="flex items-center justify-center mb-0.5">
                        <h3 className="text-base font-bold text-slate-800 leading-tight mr-1">{event.title}</h3>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" className="bg-white p-1 rounded-full shadow-sm border hover:scale-110 transition"><img src="https://www.google.com/images/branding/product/2x/maps_96in128dp.png" className="w-4 h-4" /></a>
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event.location}</p>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-12 mb-8"><button onClick={() => setShowAddEvent(true)} className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-700 transition"><Edit3 className="w-5 h-5" /> 新增行程</button></div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-3 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-white/90 via-white/90 to-transparent z-50">
        <div className="bg-slate-800 text-white rounded-[2rem] p-2 shadow-2xl flex justify-between items-center h-20 max-w-lg mx-auto border border-slate-700">
          <button onClick={() => setShowFood(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition"><Utensils className="w-6 h-6 mb-1 text-yellow-300" /><span className="text-[10px] font-bold">美食</span></button>
          <button onClick={() => setShowShopping(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition"><ShoppingBag className="w-6 h-6 mb-1 text-pink-300" /><span className="text-[10px] font-bold">購物</span></button>
          <button onClick={() => setShowAccommodation(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition"><Hotel className="w-6 h-6 mb-1 text-purple-300" /><span className="text-[10px] font-bold">住宿</span></button>
          <button onClick={() => setShowDiary(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition -mt-6"><div className="bg-blue-500 p-3 rounded-full shadow-lg border-4 border-slate-800"><BookOpen className="w-6 h-6 text-white" /></div><span className="text-[10px] font-bold mt-1">日記</span></button>
          <button onClick={() => setShowBudget(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition"><Wallet className="w-6 h-6 mb-1 text-emerald-300" /><span className="text-[10px] font-bold">記帳</span></button>
          <button onClick={() => setShowInfo(true)} className="flex-1 flex flex-col items-center justify-center active:scale-90 transition"><Info className="w-6 h-6 mb-1 text-blue-300" /><span className="text-[10px] font-bold">資訊</span></button>
        </div>
      </div>

      {/* --- Modals --- */}
      {/* Print View Modal */}
      {showPrintView && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto p-8 text-black animate-fade-in">
           <div className="max-w-3xl mx-auto print:max-w-none">
              <div className="flex justify-between mb-8 no-print">
                 <h2 className="text-2xl font-bold">預覽列印</h2>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Printer className="w-4 h-4"/> 列印 / 存為PDF</button>
                    <button onClick={() => setShowPrintView(false)} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">關閉</button>
                 </div>
              </div>
              
              {/* Printable Content */}
              <div className="space-y-8 font-serif">
                 <div className="text-center border-b-2 border-black pb-8">
                    <h1 className="text-4xl font-black mb-2">沖繩寶可夢秋旅</h1>
                    <p className="text-xl">2025.12.04 - 12.09</p>
                 </div>

                 {/* Accommodation */}
                 <section>
                    <h3 className="text-xl font-bold border-b border-gray-300 mb-4 pb-2">住宿資訊</h3>
                    <div className="grid grid-cols-1 gap-4">
                       {infoData.accommodation.map(a => (
                          <div key={a.id} className="p-4 border rounded bg-gray-50 print:bg-white print:border-black">
                             <div className="font-bold text-lg">{a.name}</div>
                             <div>地址: {a.address}</div>
                             <div>電話: {a.tel}</div>
                             {a.note && <div>備註: {a.note}</div>}
                          </div>
                       ))}
                    </div>
                 </section>

                 {/* Itinerary Loop */}
                 {itineraryData.map((day, idx) => (
                    <section key={idx} className="break-inside-avoid">
                       <h3 className="text-xl font-bold border-b border-gray-300 mb-4 pb-2 mt-8 bg-gray-100 p-2 print:bg-transparent print:border-black">
                          Day {idx+1} - {day.date} ({day.day})
                       </h3>
                       <div className="space-y-4">
                          {day.events.map(ev => (
                             <div key={ev.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0">
                                <div className="w-16 font-mono font-bold text-lg">{ev.time}</div>
                                <div className="flex-1">
                                   <div className="font-bold text-lg">{ev.title}</div>
                                   <div className="text-sm text-gray-600 mb-1">📍 {ev.location}</div>
                                   {ev.desc && <div className="text-sm whitespace-pre-line text-gray-800">{ev.desc}</div>}
                                   {ev.image && <div className="mt-2 h-32 w-full bg-gray-100 rounded overflow-hidden print:block"><img src={ev.image} className="h-full w-full object-cover" /></div>}
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>
                 ))}
                 
                 {/* Mapcodes */}
                 <section className="break-before-page">
                    <h3 className="text-xl font-bold border-b border-gray-300 mb-4 pb-2">MapCode 列表</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                       {infoData.mapcodes.map(m => (
                          <div key={m.id} className="flex justify-between border-b border-gray-100 py-1">
                             <span>{m.name}</span>
                             <span className="font-mono font-bold">{m.code}</span>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
           </div>
           <style>{`
              @media print {
                 .no-print { display: none !important; }
                 body { background: white; }
                 .break-before-page { page-break-before: always; }
              }
           `}</style>
        </div>
      )}

      {/* ... Keep all existing modals (Food, Shop, Accom, Diary, Budget, Time, Weather, Detail) ... */}
      {/* (Duplicate logic from v5.4.0 - keeping it brief for rendering) */}
      {showFood && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
           <div className="bg-white w-full sm:w-96 h-[80vh] rounded-t-[2rem] flex flex-col shadow-2xl">
              <div className="p-5 border-b flex justify-between items-center bg-yellow-50 rounded-t-[2rem]">
                 <h3 className="font-bold text-xl flex items-center text-yellow-700"><Utensils className="mr-2"/> 美食口袋名單</h3>
                 <button onClick={()=>setShowFood(false)} className="bg-white p-2 rounded-full shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 bg-yellow-50/50 space-y-3">
                 <div className="flex items-center gap-2">
                   <div className="flex-1 space-y-2">
                     <input className="w-full p-3 rounded-xl border-none shadow-sm" placeholder="餐廳名稱" value={newFood.name} onChange={e=>setNewFood({...newFood, name: e.target.value})}/>
                     <input className="w-full p-3 rounded-xl border-none shadow-sm" placeholder="地址/區域" value={newFood.address} onChange={e=>setNewFood({...newFood, address: e.target.value})}/>
                   </div>
                   <label className="w-20 h-20 bg-white rounded-xl border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-500 cursor-pointer hover:bg-yellow-100">
                      {foodImage ? <img src={foodImage} className="w-full h-full object-cover rounded-lg"/> : <Camera className="w-6 h-6"/>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setFoodImage)} />
                   </label>
                 </div>
                 <button onClick={handleAddFood} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold shadow-md">新增餐廳</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {foodList.map(f => (
                   <div key={f.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 relative flex gap-3">
                      {f.image && <img src={f.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100"/>}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800">{f.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1"/> {f.address}</p>
                      </div>
                      <button onClick={()=>handleDeleteFood(f.id)} className="text-gray-300 hover:text-red-500 h-fit"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showShopping && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
           <div className="bg-white w-full sm:w-96 h-[80vh] rounded-t-[2rem] flex flex-col shadow-2xl">
              <div className="p-5 border-b flex justify-between items-center bg-pink-50 rounded-t-[2rem]">
                 <h3 className="font-bold text-xl flex items-center text-pink-700"><ShoppingBag className="mr-2"/> 購物清單</h3>
                 <button onClick={()=>setShowShopping(false)} className="bg-white p-2 rounded-full shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 bg-pink-50/50 space-y-3">
                 <div className="flex items-center gap-2">
                   <div className="flex-1 space-y-2">
                     <input className="w-full p-3 rounded-xl border-none shadow-sm" placeholder="想買的東西" value={newShop.item} onChange={e=>setNewShop({...newShop, item: e.target.value})}/>
                     <input className="w-full p-3 rounded-xl border-none shadow-sm" placeholder="店家 (選填)" value={newShop.shop} onChange={e=>setNewShop({...newShop, shop: e.target.value})}/>
                   </div>
                   <label className="w-20 h-20 bg-white rounded-xl border-2 border-dashed border-pink-300 flex flex-col items-center justify-center text-pink-500 cursor-pointer hover:bg-pink-100">
                      {shopImage ? <img src={shopImage} className="w-full h-full object-cover rounded-lg"/> : <Camera className="w-6 h-6"/>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setShopImage)} />
                   </label>
                 </div>
                 <button onClick={handleAddShop} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold shadow-md">新增商品</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {shoppingList.map(s => (
                   <div key={s.id} className="bg-white p-3 rounded-xl shadow-sm border border-pink-100 flex justify-between items-center gap-3">
                      {s.image && <img src={s.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100"/>}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{s.item}</h4>
                        {s.shop && (
                           <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.shop)}`} target="_blank" className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full hover:bg-pink-200 inline-block mt-1">
                             {s.shop}
                           </a>
                        )}
                      </div>
                      <button onClick={()=>handleDeleteShop(s.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showAccommodation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full sm:w-96 h-[80vh] rounded-t-[2rem] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-purple-50 rounded-t-[2rem]">
              <h3 className="font-bold text-xl flex items-center text-purple-800"><Hotel className="mr-2"/> 住宿資訊</h3>
              <button onClick={() => setShowAccommodation(false)} className="bg-white p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-purple-50/50 space-y-3">
               <input className="w-full p-2 rounded border" placeholder="飯店名稱" value={newAccom.name} onChange={e=>setNewAccom({...newAccom, name:e.target.value})} />
               <input className="w-full p-2 rounded border" placeholder="地址" value={newAccom.address} onChange={e=>setNewAccom({...newAccom, address:e.target.value})} />
               <input className="w-full p-2 rounded border" placeholder="電話" value={newAccom.tel} onChange={e=>setNewAccom({...newAccom, tel:e.target.value})} />
               <input className="w-full p-2 rounded border" placeholder="備註 (如: 密碼)" value={newAccom.note} onChange={e=>setNewAccom({...newAccom, note:e.target.value})} />
               <input className="w-full p-2 rounded border" placeholder="訂房網址" value={newAccom.link} onChange={e=>setNewAccom({...newAccom, link:e.target.value})} />
               <button onClick={handleAddOrUpdateAccom} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold shadow">{isEditingAccom ? '更新住宿' : '新增住宿'}</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {infoData.accommodation.map((a,i)=>(
                <div key={a.id || i} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 relative group">
                   <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={()=>handleEditAccom(a)} className="text-gray-300 hover:text-blue-500"><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>handleDeleteAccom(a.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                   </div>
                  {a.link ? <a href={a.link} target="_blank" className="font-bold text-lg text-blue-600 mb-2 flex items-center hover:underline">{a.name} <ExternalLink className="w-4 h-4 ml-1"/></a> : <h4 className="font-bold text-lg text-blue-900 mb-2">{a.name}</h4>}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📍 {a.address}</p>
                    <p>📞 {a.tel}</p>
                    {a.note && <p className="text-orange-500 font-medium">💡 {a.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl">資訊百寶袋</h3>
              <button onClick={() => setShowInfo(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="flex overflow-x-auto p-2 space-x-2 no-scrollbar bg-gray-50 border-b">
               {[{id:'mapcodes',label:'MapCode'},{id:'japanese',label:'日語'},{id:'emergency',label:'緊急'},{id:'checklist',label:'清單'}].map(t=>(
                 <button key={t.id} onClick={()=>setInfoTab(t.id)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${infoTab===t.id?'bg-slate-800 text-white':'bg-white border'}`}>{t.label}</button>
               ))}
            </div>
            <div className="p-3 bg-slate-50 border-b">
               {infoTab === 'mapcodes' && <div className="flex gap-2"><input placeholder="地點名稱" className="flex-1 p-2 rounded border" onChange={e=>setNewInfoInput({...newInfoInput, name:e.target.value})} /><input placeholder="Code" className="w-24 p-2 rounded border" onChange={e=>setNewInfoInput({...newInfoInput, code:e.target.value})} /><button onClick={()=>handleAddInfo('mapcodes')} className="bg-slate-800 text-white px-3 rounded">+</button></div>}
               {infoTab === 'checklist' && <div className="flex gap-2"><input placeholder="待辦事項" className="flex-1 p-2 rounded border" onChange={e=>setNewInfoInput({...newInfoInput, text:e.target.value})} /><button onClick={()=>handleAddInfo('checklist')} className="bg-slate-800 text-white px-3 rounded">+</button></div>}
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50">
               {infoData[infoTab] && infoData[infoTab].map((item, i) => (
                 <div key={item.id || i} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-start group relative">
                    <div className="flex-1">
                       {infoTab==='mapcodes' && <><div className="font-bold">{item.name}</div><div className="font-mono text-blue-600">{item.code}</div></>}
                       {infoTab==='checklist' && <div className="flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-green-500"/>{item.text}</div>}
                       {infoTab==='japanese' && <><div className="text-xs text-gray-400">{item.ch}</div><div className="font-bold">{item.jp}</div></>}
                       {infoTab==='emergency' && <div className="flex justify-between"><span className="font-bold text-red-800">{item.name}</span><a href={`tel:${item.tel}`} className="font-bold text-blue-600">{item.tel}</a></div>}
                    </div>
                    <button onClick={()=>handleDeleteInfo(infoTab, item.id)} className="text-gray-300 hover:text-red-500 ml-2"><Trash2 className="w-4 h-4"/></button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {showDiary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl">日記</h3>
              <button onClick={() => setShowDiary(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
               <textarea value={newDiaryText} onChange={e=>setNewDiaryText(e.target.value)} placeholder="寫日記..." className="w-full h-32 bg-gray-50 p-4 rounded-2xl resize-none outline-none mb-4" />
               
               {/* Restore Diary Photo Preview */}
               <div className="flex justify-between mb-6">
                 <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
                   <Camera className="w-4 h-4"/> 照片
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setDiaryImage)} />
                 </label>
                 <button onClick={handleAddDiary} className="bg-black text-white px-6 py-2 rounded-xl font-bold">發布</button>
               </div>
               {diaryImage && <img src={diaryImage} className="h-32 object-cover rounded-xl mb-4 border" />}

               <div className="space-y-4 mt-6">
                 {diaries.map(d => (
                   <div key={d.id} className="bg-gray-50 p-4 rounded-2xl">
                     {d.image && <img src={d.image} className="w-full rounded-xl mb-2 object-cover"/>}
                     <p className="text-gray-800">{d.text}</p>
                     <div className="text-right text-xs text-gray-400 mt-2">{d.date}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {showBudget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl">記帳本</h3>
              <button onClick={() => setShowBudget(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-blue-50">
               <div className="flex gap-2">
                 <input value={newItemName} onChange={e=>setNewItemName(e.target.value)} placeholder="項目" className="flex-1 p-3 rounded-2xl border-none shadow-sm" />
                 <input type="number" value={newItemCost} onChange={e=>setNewItemCost(e.target.value)} placeholder="$" className="w-20 p-3 rounded-2xl border-none shadow-sm" />
                 <button onClick={handleAddBudget} className="bg-blue-600 text-white w-12 rounded-2xl flex items-center justify-center shadow-lg"><Plus/></button>
               </div>
               <label className="mt-3 flex items-center space-x-2 text-sm text-gray-500 cursor-pointer bg-white px-3 py-2 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50">
                  <Camera className="w-4 h-4" />
                  <span>{budgetImage ? '已選擇照片' : '上傳收據/照片'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setBudgetImage)} />
               </label>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {budgets && budgets.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
                  <div className="flex items-center gap-3">
                     {b.image && <img src={b.image} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />}
                     <span>{b.item}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-600">${b.cost}</span>
                    <button onClick={()=>handleDeleteBudget(b.id)}><Trash2 className="w-4 h-4 text-gray-300"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t rounded-b-[2rem] mb-safe">
               <div className="flex justify-between items-end">
                 <span className="text-gray-500 text-sm">Total</span>
                 <span className="text-3xl font-black text-gray-800">${totalCost}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {showTimeModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowTimeModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
               <h3 className="font-bold text-lg flex items-center"><Clock className="mr-2"/> 世界時間</h3>
               <button onClick={() => setShowTimeModal(false)}><X className="w-6 h-6"/></button>
             </div>
             <div className="p-6 grid grid-cols-2 gap-4 divide-x">
                <div className="text-center">
                   <div className="text-xs text-gray-400 font-bold mb-2">📍 當地 (Local)</div>
                   <div className="text-3xl font-black text-gray-800 font-mono">{currentTime}</div>
                </div>
                <div className="text-center pl-4">
                   <select 
                     className="text-xs font-bold text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded border-none outline-none"
                     value={JSON.stringify(selectedTimeCity)}
                     onChange={(e) => setSelectedTimeCity(JSON.parse(e.target.value))}
                   >
                     {WORLD_CITIES.map(c => (
                       <option key={c.name} value={JSON.stringify(c)}>{c.name}</option>
                     ))}
                   </select>
                   {/* Note: Simple time display for target city, ideally needs timezone calc */}
                   <div className="text-3xl font-black text-blue-600 font-mono">
                      {new Date().toLocaleTimeString('en-US', { timeZone: selectedTimeCity.tz, hour: '2-digit', minute: '2-digit', hour12: false })}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Weather Modal (Hourly) */}
      {showWeatherModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowWeatherModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
               <h3 className="font-bold text-lg flex items-center"><Cloud className="mr-2"/> 天氣預報</h3>
               <button onClick={() => setShowWeatherModal(false)}><X className="w-6 h-6"/></button>
             </div>
             <div className="p-6 space-y-6">
                {/* Current Weather */}
                <div className="grid grid-cols-2 gap-4 divide-x mb-4">
                    <div className="text-center flex flex-col items-center">
                       <div className="text-xs text-gray-400 font-bold mb-2">📍 當地</div>
                       <WeatherIcon code={localWeather.code} />
                       <div className="text-2xl font-bold text-gray-800 mt-1">{localWeather.temp}°</div>
                    </div>
                    <div className="text-center pl-4 flex flex-col items-center">
                       <div className="text-xs text-gray-400 font-bold mb-2">🏠 台北</div>
                       <WeatherIcon code={targetCityWeather.code} />
                       <div className="text-2xl font-bold text-orange-600 mt-1">{targetCityWeather.temp}°</div>
                    </div>
                </div>
                
                {/* Hourly Forecast */}
                <div>
                   <h4 className="text-sm font-bold text-gray-500 mb-3">未來 24 小時 (當地)</h4>
                   <div className="flex overflow-x-auto space-x-4 pb-2 no-scrollbar">
                      {localHourly.length > 0 ? localHourly.map((h, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[60px] bg-gray-50 p-2 rounded-xl">
                           <span className="text-xs font-mono text-gray-500">{h.time}</span>
                           <WeatherIcon code={h.code} />
                           <span className="font-bold text-sm">{h.temp}°</span>
                           <span className="text-[10px] text-blue-400 flex items-center"><Droplets className="w-2 h-2 mr-1"/>{h.rain}%</span>
                        </div>
                      )) : <div className="text-gray-400 text-sm">讀取中或 GPS 未開啟...</div>}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Event Detail (Intro Photo Upload) */}
      {showEventDetail && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
           <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
              <button onClick={()=>setShowEventDetail(null)} className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-slate-800 hover:bg-white transition"><ArrowLeft className="w-6 h-6"/></button>
           </div>
           <div className="h-[45vh] relative flex-shrink-0 bg-slate-100">
              <img src={showEventDetail.image} className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 text-center px-6 pointer-events-none">
                 <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{showEventDetail.title}</h2>
                 <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm border border-white/30">
                    <MapPin className="w-3 h-3 mr-1"/> {showEventDetail.location}
                 </div>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-8 bg-white -mt-6 rounded-t-[2.5rem] relative z-10 shadow-xl">
              {showEventDetail.desc ? (<p className="text-slate-600 leading-8 text-justify whitespace-pre-line mb-6">{showEventDetail.desc}</p>) : (<div className="text-center text-gray-400 py-10">暫無詳細介紹</div>)}
              
              <div className="mt-8 mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-400 uppercase">介紹照片</h4>
                    <label className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded cursor-pointer">
                       + 新增介紹圖
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, handleAddIntroImage)} />
                    </label>
                  </div>
                  <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                    {showEventDetail.introImages && showEventDetail.introImages.map((img, idx) => (
                      <img key={idx} src={img} className="h-32 w-48 object-cover rounded-xl shadow-md flex-shrink-0"/>
                    ))}
                  </div>
              </div>

              {/* Moments */}
              <div className="mt-10 border-t pt-8">
                 <div className="flex justify-between items-center mb-4 px-2">
                    <h4 className="font-bold text-gray-800 text-lg">📸 精彩瞬間</h4>
                    <button onClick={()=>handleAddMoment(showEventDetail.title)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold">+ 上傳照片</button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {moments.filter(m=>m.eventTitle===showEventDetail.title).map(m=>(
                      <div key={m.id} className="relative">
                         <img src={m.image} className="aspect-square rounded-2xl object-cover shadow-md bg-gray-50 w-full"/>
                         <button onClick={(e)=>{e.stopPropagation();handleDeleteMoment(m.id)}} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl">{isEditingEvent ? '編輯行程' : '新增行程'}</h3>
              <button onClick={() => { setShowAddEvent(false); setIsEditingEvent(false); }} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 space-y-4 overflow-y-auto">
               <div><label className="block font-bold text-sm text-gray-500 mb-1">時間</label><input type="time" className="w-full p-3 bg-gray-50 rounded-xl" value={newEvent.time} onChange={e=>setNewEvent({...newEvent, time:e.target.value})}/></div>
               <div><label className="block font-bold text-sm text-gray-500 mb-1">標題</label><input className="w-full p-3 bg-gray-50 rounded-xl" value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title:e.target.value})}/></div>
               <div><label className="block font-bold text-sm text-gray-500 mb-1">地點</label><input className="w-full p-3 bg-gray-50 rounded-xl" value={newEvent.location} onChange={e=>setNewEvent({...newEvent, location:e.target.value})}/></div>
               <div>
                  <label className="block font-bold text-sm text-gray-500 mb-1">照片</label>
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                    {newEventImage ? <img src={newEventImage} className="h-24 object-cover rounded-lg" /> : <div className="flex flex-col items-center text-gray-400"><Camera className="w-6 h-6 mb-1"/><span>點擊上傳照片</span></div>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setNewEventImage)} />
                  </label>
               </div>
               <div><label className="block font-bold text-sm text-gray-500 mb-1">介紹</label><textarea className="w-full p-3 bg-gray-50 rounded-xl h-24" value={newEvent.desc} onChange={e=>setNewEvent({...newEvent, desc:e.target.value})}/></div>
               <button onClick={handleSaveEvent} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">{isEditingEvent ? '儲存修改' : '確認新增'}</button>
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-2 animate-fade-in" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} className="max-w-full max-h-full object-contain rounded-lg"/>
        </div>
      )}
    </div>
  );
}