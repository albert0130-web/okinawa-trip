// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  MapPin, Camera, Calendar, Wallet, BookOpen, 
  Sun, Cloud, ChevronRight, Navigation, 
  Plus, Trash2, X, CheckSquare,
  Sunset, ArrowRightLeft, Clock, Map as MapIcon, Car,
  AlertTriangle, Info
} from 'lucide-react';

// --- 1. Firebase 初始化 ---
let app, auth, db;
const appId = 'default-app-id';
let isLocalMode = false;

try {
  // @ts-ignore
  if (typeof __firebase_config !== 'undefined') {
    // @ts-ignore
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    throw new Error("Local Mode");
  }
} catch (e) {
  console.log("進入本機預覽模式");
  isLocalMode = true;
}

// --- 2. 行程資料 ---
const ITINERARY_DATA = [
  {
    date: '12/4',
    day: '週三',
    fullDate: '2024/12/04',
    location: '台北 ➔ 沖繩',
    events: [
      { 
        time: '14:10', 
        title: '接小孩放學', 
        location: '學校', 
        type: 'transport', 
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
        desc: '記得帶兩把雨傘，還有小朋友的水壺。'
      },
      { 
        time: '16:00', 
        title: '抵達桃園 T1', 
        location: '桃園機場', 
        travelTime: '50分', 
        image: 'https://images.unsplash.com/photo-1570719830209-646736021f43?auto=format&fit=crop&w=800&q=80',
        desc: '先去櫃檯報到，然後去 B1 吃漢堡王。'
      },
      { time: '18:20', title: '樂桃 MM930 起飛', location: '桃園機場', travelTime: '等待', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80' },
      { time: '20:50', title: '抵達那霸機場', location: '那霸機場', travelTime: '飛行 90分', image: 'https://images.unsplash.com/photo-1542296332-2e44a99184e9?auto=format&fit=crop&w=800&q=80' },
      { 
        time: '21:30', 
        title: '入住飯店', 
        location: 'Glory island okinawa -SOBE-', 
        travelTime: '電車 20分', 
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        desc: '飯店大門密碼是 1234，記得跟櫃台拿早餐券。'
      },
    ]
  },
  {
    date: '12/5',
    day: '週四',
    fullDate: '2024/12/05',
    location: '南部觀光',
    events: [
      { time: '08:30', title: 'GCL 領車', location: 'GCL Rental', type: 'car', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80' },
      { 
        time: '09:20', 
        title: 'DMM 水族館', 
        location: 'iias 沖繩豐崎', 
        travelTime: '車程 20分', 
        image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=800&q=80',
        desc: '最新的水族館！有樹懶可以近距離接觸，水母區非常漂亮，記得幫小朋友拍照。'
      },
      { time: '13:30', title: '平和祈念公園', location: '平和祈念公園', travelTime: '車程 21分', image: 'https://images.unsplash.com/photo-1596230529625-7ee541361957?auto=format&fit=crop&w=800&q=80' },
      { 
        time: '14:00', 
        title: '玉泉洞 (沖繩世界)', 
        location: 'Okinawa World', 
        travelTime: '車程 12分', 
        image: 'https://images.unsplash.com/photo-1504280506541-aca14220e80d?auto=format&fit=crop&w=800&q=80',
        desc: '鐘乳石洞裡面很濕滑，走路要小心。出來後有太鼓表演可以看。'
      },
      { time: '18:00', title: 'COSTCO 晚餐', location: 'Costco Nanjo', travelTime: '車程 20分', image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80' },
      { time: '20:30', title: '回飯店', location: 'Family Condo Chatan Hills', travelTime: '車程 40分', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80' },
    ]
  },
  {
    date: '12/6',
    day: '週五',
    fullDate: '2024/12/06',
    location: '中部遊玩',
    events: [
      { time: '09:30', title: '沖繩兒童樂園', location: 'Okinawa Zoo', travelTime: '車程 15分', image: 'https://images.unsplash.com/photo-1559929562-b9e9e1605335?auto=format&fit=crop&w=800&q=80' },
      { time: '13:30', title: '永旺夢樂城', location: 'AEON MALL Rycom', travelTime: '車程 15分', image: 'https://images.unsplash.com/photo-1519567241046-7f570eee3d9f?auto=format&fit=crop&w=800&q=80' },
      { time: '17:00', title: '迴轉壽司市場', location: 'Gourmet Sushi', travelTime: '車程 10分', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80' },
      { time: '19:20', title: '美國村煙火', location: 'American Village', travelTime: '步行', image: 'https://plus.unsplash.com/premium_photo-1661964177687-57387c2cbd14?auto=format&fit=crop&w=800&q=80' },
    ]
  },
  {
    date: '12/7',
    day: '週六',
    fullDate: '2024/12/07',
    location: '北部探險',
    events: [
      { time: '09:00', title: '名護鳳梨園', location: 'Nago Pineapple Park', travelTime: '車程 60分', image: 'https://images.unsplash.com/photo-1589820296156-2454bb8a4d50?auto=format&fit=crop&w=800&q=80' },
      { time: '11:30', title: '百年古家 大家', location: 'Ufuya', travelTime: '車程 15分', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80' },
      { time: '13:30', title: '美麗海水族館', location: 'Churaumi Aquarium', travelTime: '車程 20分', image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80' },
      { time: '17:00', title: '備瀨福木林道', location: 'Bise Fukugi Tree Road', travelTime: '車程 10分', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
    ]
  },
  {
    date: '12/8',
    day: '週日',
    fullDate: '2024/12/08',
    location: '放電行程',
    events: [
      { time: '09:00', title: 'PARCO CITY', location: 'PARCO CITY', travelTime: '車程 30分', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80' },
      { time: '13:00', title: '浦添大公園', location: 'Urasoe Grand Park', travelTime: '車程 20分', image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80' },
      { time: '17:00', title: '東南植物樂園', location: 'Southeast Botanical Gardens', travelTime: '車程 40分', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80' },
    ]
  },
  {
    date: '12/9',
    day: '週一',
    fullDate: '2024/12/09',
    location: '回程',
    events: [
      { time: '08:30', title: '瀨長島', location: 'Umikaji Terrace', travelTime: '車程 50分', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
      { time: '12:30', title: 'ASHIBINAA Outlet', location: 'Outlet Mall Ashibinaa', travelTime: '車程 15分', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80' },
      { time: '16:00', title: '還車 & 去機場', location: 'Naha Airport', travelTime: '接駁車', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80' },
    ]
  },
];

const USEFUL_INFO = {
  mapcodes: [
    { name: 'DMM水族館', code: '232 543 400*25' },
    { name: '玉泉洞', code: '232 495 330*28' },
    { name: '美麗海水族館', code: '553 075 797' },
    { name: '美國村', code: '33 526 450*63' },
  ],
  japanese: [
    { ch: '謝謝', jp: 'ありがとう' },
    { ch: '廁所在哪裡?', jp: 'トイレはどこですか?' },
    { ch: '請給我水', jp: 'お水をください' },
    { ch: '這個多少錢?', jp: 'これはいくらですか？' },
    { ch: '不要蔥', jp: 'ネギ抜きで' },
  ],
  checklist: ['護照', '駕照+日文譯本', '網卡', '行動電源', '暈車藥', '雨具']
};

export default function OkinawaTravelApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0); 
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  // Dashboard 狀態
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [weather, setWeather] = useState({ temp: '--', code: 0, sunset: '--:--' });
  const [jpyRate, setJpyRate] = useState(0.215); 
  const [calcAmount, setCalcAmount] = useState('');

  // 視窗開關
  const [showDiary, setShowDiary] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(null);

  // 資料庫資料
  const [budgets, setBudgets] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [moments, setMoments] = useState([]);

  // 輸入暫存
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newDiaryText, setNewDiaryText] = useState('');
  const [diaryImage, setDiaryImage] = useState(null);

  // --- Auth & Sync ---
  useEffect(() => {
    const initAuth = async () => {
      // 模擬登入 (本機或雲端)
      if (!isLocalMode && typeof signInAnonymously === 'function') {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn("Auth check: switching to local mode");
          setIsLocalMode(true);
        }
      }
    };
    initAuth();
    if (!isLocalMode && auth) {
      return onAuthStateChanged(auth, setUser);
    } else {
      // 本機模式假裝已登入
      setUser({ uid: 'local-user' });
    }
  }, [isLocalMode]);

  useEffect(() => {
    if (!user || isLocalMode) return;
    
    // 定義錯誤處理函式：如果遇到權限錯誤，自動切換到本機模式，且只顯示警告
    const handleError = (err) => {
      if (err.code === 'permission-denied' || err.code === 'unavailable') {
        console.warn("雲端資料庫連線受限，自動切換至本機預覽模式 (Local Mode)");
        setIsLocalMode(true);
      } else {
        console.error("Firestore sync error:", err);
      }
    };

    const qBudget = query(collection(db, 'artifacts', appId, 'public', 'data', 'budget'), orderBy('createdAt', 'desc'));
    const unsubBudget = onSnapshot(qBudget, 
      (snap) => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError
    );
    
    const qDiary = query(collection(db, 'artifacts', appId, 'public', 'data', 'diary'), orderBy('createdAt', 'desc'));
    const unsubDiary = onSnapshot(qDiary, 
      (snap) => setDiaries(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError
    );
    
    const qMoments = query(collection(db, 'artifacts', appId, 'public', 'data', 'moments'), orderBy('createdAt', 'desc'));
    const unsubMoments = onSnapshot(qMoments, 
      (snap) => setMoments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError
    );

    return () => { unsubBudget(); unsubDiary(); unsubMoments(); };
  }, [user, isLocalMode]);

  // --- Loop Updates ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }));
      setCurrentDateStr(now.toLocaleDateString('en-US', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }));
    }, 1000);

    fetch('https://api.open-meteo.com/v1/forecast?latitude=26.21&longitude=127.68&current_weather=true&daily=sunset&timezone=Asia%2FTokyo')
      .then(res => res.json())
      .then(data => {
        let sunsetTime = '--:--';
        if (data.daily?.sunset?.[0]) {
          sunsetTime = new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        if(data.current_weather) {
          setWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode, sunset: sunsetTime });
        }
      })
      .catch(e => console.log("Weather fetch failed (offline?)"));

    fetch('https://api.frankfurter.app/latest?from=JPY&to=TWD')
      .then(res => res.json())
      .then(d => { if(d.rates?.TWD) setJpyRate(d.rates.TWD); })
      .catch(e => console.log("Rate fetch failed (offline?)"));

    return () => clearInterval(timer);
  }, []);

  // --- Handlers ---
  const handleAddBudget = async () => {
    if (!newItemName || !newItemCost || !user) return;
    if (isLocalMode) {
      // 本機模式：只更新畫面，不存資料庫
      const newBudget = { id: Date.now().toString(), item: newItemName, cost: Number(newItemCost) };
      setBudgets([newBudget, ...budgets]);
      setNewItemName(''); setNewItemCost('');
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'budget'), {
        item: newItemName, cost: Number(newItemCost), createdAt: serverTimestamp(), userId: user.uid
      });
      setNewItemName(''); setNewItemCost('');
    } catch (e) {
      console.error("Add budget failed", e);
      // 如果寫入失敗，也切換到本機模式並重試
      setIsLocalMode(true);
      const newBudget = { id: Date.now().toString(), item: newItemName, cost: Number(newItemCost) };
      setBudgets([newBudget, ...budgets]);
      setNewItemName(''); setNewItemCost('');
    }
  };
  
  const handleDeleteBudget = async (id) => {
    if (isLocalMode) {
      setBudgets(budgets.filter(b => b.id !== id));
      return;
    }
    try {
      deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budget', id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };
  
  const handleAddDiary = async () => {
    if (!newDiaryText && !diaryImage) return;
    if (isLocalMode) {
      const newDiary = { id: Date.now().toString(), text: newDiaryText, image: diaryImage, date: new Date().toLocaleDateString() };
      setDiaries([newDiary, ...diaries]);
      setNewDiaryText(''); setDiaryImage(null);
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'diary'), {
        text: newDiaryText, image: diaryImage, createdAt: serverTimestamp(), date: new Date().toLocaleDateString()
      });
      setNewDiaryText(''); setDiaryImage(null);
    } catch (e) {
      console.error("Add diary failed", e);
      setIsLocalMode(true);
      const newDiary = { id: Date.now().toString(), text: newDiaryText, image: diaryImage, date: new Date().toLocaleDateString() };
      setDiaries([newDiary, ...diaries]);
      setNewDiaryText(''); setDiaryImage(null);
    }
  };

  const handleAddMoment = async (title) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if(file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (isLocalMode) {
             setMoments([{id: Date.now().toString(), eventTitle: title, image: reader.result}, ...moments]);
             return;
          }
          try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'moments'), { eventTitle: title, image: reader.result, createdAt: serverTimestamp() });
          } catch(e) {
             console.error("Add moment failed", e);
             setIsLocalMode(true);
             setMoments([{id: Date.now().toString(), eventTitle: title, image: reader.result}, ...moments]);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleImageUpload = (e, setFn) => {
    const file = e.target.files[0];
    if(file && file.size < 1000000) {
      const reader = new FileReader();
      reader.onloadend = () => setFn(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const totalCost = useMemo(() => budgets.reduce((a, c) => a + c.cost, 0), [budgets]);

  const WeatherIcon = ({ code }) => {
    if (code <= 3) return <Sun className="w-10 h-10 text-orange-500" />;
    return <Cloud className="w-10 h-10 text-blue-400" />;
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans pb-32">
      <div className="hidden">
        <meta name="theme-color" content="#eff6ff" />
        <link rel="manifest" href="/manifest.json" />
      </div>

      {/* 1. Header */}
      <div className="p-5 pt-8 bg-white border-b border-gray-100 rounded-b-[2.5rem] shadow-sm z-10 relative">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tight mb-1">OKINAWA TRIP 🏖️</h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide">2024.12.04 - 12.09 (6 Days)</p>
          </div>
          <div className="bg-blue-100 p-2 rounded-full animate-bounce-slow">
            <MapIcon className="text-blue-600 w-6 h-6"/>
          </div>
        </div>
      </div>

      {/* 2. Days Tabs */}
      <div className="mt-4 px-4 overflow-x-auto snap-x flex space-x-3 no-scrollbar pb-2">
        {ITINERARY_DATA.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`snap-center flex-shrink-0 w-24 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
              activeTab === index 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' 
                : 'bg-white text-gray-400 border-white shadow-sm'
            }`}
          >
            <span className="text-xs font-medium opacity-80">{item.date}</span>
            <span className="text-lg font-bold">{item.day}</span>
          </button>
        ))}
      </div>

      {/* 4, 5, 3. Dashboard */}
      <div className="px-4 mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 relative overflow-hidden h-32 flex flex-col justify-center">
            <div className="text-xs text-blue-500 font-bold mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3"/> TOKYO
            </div>
            <div className="text-3xl font-black text-gray-800 tracking-tight font-mono">{currentTime}</div>
            <div className="text-xs text-gray-400 mt-1">{currentDateStr}</div>
          </div>

          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 relative overflow-hidden h-32 flex flex-col justify-between">
            <div className="absolute top-3 right-3 animate-pulse">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex justify-between items-start pt-2">
              <div>
                <div className="text-xs text-gray-400">NAHA</div>
                <div className="text-2xl font-bold">{weather.temp}°</div>
              </div>
              <WeatherIcon code={weather.code} />
            </div>
            <div className="flex items-center text-orange-400 text-xs font-medium">
               <Sunset className="w-3 h-3 mr-1" /> {weather.sunset}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">¥</div>
             <ArrowRightLeft className="w-4 h-4 text-gray-300" />
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">NT</div>
           </div>
           
           <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 flex-1 mx-3">
             <input 
               type="number" 
               placeholder="1000"
               className="w-full bg-transparent outline-none text-right font-mono text-gray-700 font-bold"
               value={calcAmount}
               onChange={(e) => setCalcAmount(e.target.value)}
             />
           </div>
           
           <div className="text-blue-600 font-bold font-mono min-w-[60px] text-right">
             ${((parseFloat(calcAmount) || 0) * jpyRate).toFixed(0)}
           </div>
        </div>
      </div>

      {/* --- ITINERARY TIMELINE (Snake/Zigzag Layout) --- */}
      <div className="px-2 mt-8 pb-10 overflow-hidden">
        <h2 className="text-sm font-bold text-gray-400 mb-6 pl-4 tracking-widest uppercase">Itinerary</h2>
        
        <div className="relative w-full max-w-md mx-auto space-y-12">
          
          {ITINERARY_DATA[activeTab].events.map((event, idx) => {
            const isLeft = idx % 2 !== 0; 
            const hasNext = idx < ITINERARY_DATA[activeTab].events.length - 1;

            return (
              <div key={idx} className={`relative flex items-center ${isLeft ? 'justify-start pl-2' : 'justify-end pr-2'}`}>
                
                {/* Connector Line */}
                {hasNext && (
                  <svg className="absolute top-1/2 left-0 w-full h-40 -z-10 pointer-events-none overflow-visible" style={{ top: '50%' }}>
                    <path 
                      d={!isLeft 
                        ? "M 75% 0 C 75% 50, 25% 50, 25% 100" 
                        : "M 25% 0 C 25% 50, 75% 50, 75% 100"
                      }
                      fill="none" 
                      stroke="#cbd5e1" 
                      strokeWidth="2" 
                      strokeDasharray="6 4"
                    />
                    
                    {event.travelTime && (
                      <foreignObject x="0" y="35%" width="100%" height="30">
                        <div className="flex justify-center">
                           <div className="bg-white text-slate-500 text-[10px] px-2 py-1 rounded-full border border-slate-300 shadow-sm font-bold flex items-center">
                              <Car className="w-3 h-3 mr-1"/> {event.travelTime}
                           </div>
                        </div>
                      </foreignObject>
                    )}
                  </svg>
                )}

                {/* Time */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-2 text-right' : 'left-2 text-left'} w-12`}>
                   <span className="font-bold text-slate-400 font-mono text-sm block">{event.time}</span>
                </div>

                {/* Card Body: 變大、文字下移、無框陰影 */}
                <div 
                   onClick={() => setShowEventDetail(event)}
                   className="relative w-[85%] h-56 rounded-[2rem] shadow-xl bg-white group active:scale-95 transition-all cursor-pointer z-10 flex flex-col overflow-hidden"
                 >
                    {/* 上半部：大圖片 */}
                    <div className="h-[75%] w-full relative overflow-hidden">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>

                    {/* 下半部：文字區域 (已將 Google Map 圖示移至此處) */}
                    <div className="h-[25%] flex flex-col justify-center items-center bg-white relative z-10">
                      <div className="flex items-center justify-center mb-0.5">
                        <h3 className="text-base font-bold text-slate-800 leading-tight mr-1">{event.title}</h3>
                        {/* Google Map Icon Link */}
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // 防止觸發卡片點擊事件
                          className="bg-white p-1 rounded-full shadow-sm border border-slate-100 hover:scale-110 transition-transform"
                        >
                          <img src="https://www.google.com/images/branding/product/2x/maps_96in128dp.png" alt="Google Maps" className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center">
                         <MapPin className="w-3 h-3 mr-1" /> {event.location}
                      </p>
                    </div>
                 </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 7, 8, 9. Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-40">
        <div className="bg-gray-900 text-white rounded-[2rem] p-2 shadow-2xl flex justify-around items-center h-16 max-w-lg mx-auto">
          <button onClick={() => setShowDiary(true)} className="flex-1 flex flex-col items-center justify-center active:text-blue-300 transition">
             <BookOpen className="w-5 h-5 mb-0.5" />
             <span className="text-[10px] font-bold">7 日記</span>
          </button>
          
          <div className="w-px h-6 bg-gray-700"></div>

          <button onClick={() => setShowBudget(true)} className="flex-1 flex flex-col items-center justify-center active:text-blue-300 transition relative">
             {totalCost > 0 && <div className="absolute top-1 right-8 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>}
             <Wallet className="w-5 h-5 mb-0.5" />
             <span className="text-[10px] font-bold">8 記帳</span>
          </button>

          <div className="w-px h-6 bg-gray-700"></div>

          <button onClick={() => setShowInfo(true)} className="flex-1 flex flex-col items-center justify-center active:text-blue-300 transition">
             <CheckSquare className="w-5 h-5 mb-0.5" />
             <span className="text-[10px] font-bold">9 資訊</span>
          </button>
        </div>
      </div>

      {/* --- Modals (記帳) --- */}
      {showBudget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] sm:rounded-[2rem] h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-xl">記帳本 {isLocalMode && "(預覽模式)"}</h3>
              <button onClick={() => setShowBudget(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-blue-50">
               <div className="flex gap-2">
                 <input value={newItemName} onChange={e=>setNewItemName(e.target.value)} placeholder="項目" className="flex-1 p-3 rounded-2xl border-none shadow-sm" />
                 <input type="number" value={newItemCost} onChange={e=>setNewItemCost(e.target.value)} placeholder="$" className="w-20 p-3 rounded-2xl border-none shadow-sm" />
                 <button onClick={handleAddBudget} className="bg-blue-600 text-white w-12 rounded-2xl flex items-center justify-center shadow-lg"><Plus/></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {budgets.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <span>{b.item}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-600">${b.cost}</span>
                    <button onClick={()=>handleDeleteBudget(b.id)}><Trash2 className="w-4 h-4 text-gray-300"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t rounded-b-[2rem] mb-safe">
               <div className="flex justify-between items-end">
                 <span className="text-gray-500 text-sm">Total Spent</span>
                 <span className="text-3xl font-black text-gray-800">${totalCost.toLocaleString()}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {showDiary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 rounded-t-[2rem] sm:rounded-[2rem] h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 flex justify-between items-center">
              <h3 className="font-bold text-xl">旅行日記</h3>
              <button onClick={() => setShowDiary(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
               <textarea value={newDiaryText} onChange={e=>setNewDiaryText(e.target.value)} placeholder="寫點什麼..." className="w-full h-32 bg-gray-50 p-4 rounded-2xl resize-none outline-none mb-4" />
               <div className="flex justify-between mb-6">
                 <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
                   <Camera className="w-4 h-4"/> 照片
                   <input type="file" accept="image/*" className="hidden" onChange={e=>handleImageUpload(e, setDiaryImage)} />
                 </label>
                 <button onClick={handleAddDiary} className="bg-black text-white px-6 py-2 rounded-xl font-bold">發布</button>
               </div>
               <div className="space-y-6">
                 {diaries.map(d => (
                   <div key={d.id}>
                     {d.image && <img src={d.image} className="w-full rounded-2xl mb-2 object-cover max-h-60" />}
                     <p className="bg-gray-50 p-4 rounded-2xl text-gray-700 leading-relaxed">{d.text}</p>
                     <div className="text-right text-xs text-gray-400 mt-1">{d.date}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {showEventDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              <div className="relative h-48 flex-shrink-0">
                 <img src={showEventDetail.image} alt={showEventDetail.title} className="w-full h-full object-cover"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                 <button onClick={()=>setShowEventDetail(null)} className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white"><X className="w-5 h-5"/></button>
                 <div className="absolute bottom-4 left-6 right-6">
                    <div className="font-mono text-blue-300 mb-1 opacity-90">{showEventDetail.time}</div>
                    <h3 className="text-2xl font-bold text-white leading-tight">{showEventDetail.title}</h3>
                 </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                 
                 {/* 景點介紹 (新增功能) */}
                 {showEventDetail.desc && (
                   <div className="bg-blue-50 p-4 rounded-xl mb-4 text-sm text-gray-700 leading-relaxed">
                     <h4 className="font-bold text-blue-600 mb-1 flex items-center"><Info className="w-4 h-4 mr-1"/> 介紹</h4>
                     {showEventDetail.desc}
                   </div>
                 )}

                 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showEventDetail.location)}`} target="_blank" className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-blue-600 font-bold mb-6 hover:bg-blue-50 transition transform active:scale-95 border border-blue-100">
                   <Navigation className="w-5 h-5"/> 導航至 {showEventDetail.location}
                 </a>
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-700">精彩瞬間</h4>
                    <button onClick={()=>handleAddMoment(showEventDetail.title)} className="text-xs bg-white border px-3 py-1 rounded-lg hover:bg-gray-100">+ 新增照片</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {moments.filter(m=>m.eventTitle===showEventDetail.title).map(m=>(
                      <img key={m.id} src={m.image} className="aspect-square rounded-xl object-cover shadow-sm bg-white" />
                    ))}
                    {moments.filter(m=>m.eventTitle===showEventDetail.title).length===0 && <div className="col-span-2 text-center py-10 text-gray-300 border-2 border-dashed rounded-xl">尚無照片</div>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}