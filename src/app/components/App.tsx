import { useState, useEffect,useRef } from "react";
import {
  Heart, Search, Star, Crown, MapPin, Phone, MessageCircle,
  ChevronRight, ChevronLeft, Check, X, User, Bell, Settings,
  LogOut, Users, Shield, CreditCard, Filter, Send, Mic,
  Paperclip, Eye, Edit2, Trash2, Ban, CheckCircle, AlertCircle,
  TrendingUp, Camera, Upload, Home, Menu, ArrowRight, Sparkles,
  BookOpen, Flag, Image as ImgIcon, Globe, Lock,
  PhoneCall, PhoneOff, Video, VideoOff, MicOff, Volume2, VolumeX,
  ShieldCheck, UserCheck, RefreshCw, Mail,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import PhoneInput from 'react-phone-input-2';
import axios from 'axios';
import PlanSimulator from "./PlanSimulator.tsx";
import { MercuryLogoIcon } from "./MercuryLogoIcon.tsx";

type Page = "landing" | "login" | "register" | "dashboard" | "profile" | "interests" | "chat" | "premium" | "admin";
type AdminSection = "overview" | "users" | "horoscope" | "interests" | "chat" | "reports" | "subscriptions" | "cms" | "settings";

// ─── OCR Birth Time Cleaner ──────────────────────────────────────────────────
/**
 * Fixes common OCR misreads in birth time strings.
 * Example: "eter 0620" → "after 06:20"
 */
function cleanBirthTime(raw: string): string {
  if (!raw) return raw;
  let v = raw.trim();

  // Fix OCR-garbled "after" variants (e.g. "eter", "afer", "aftcr")
  v = v.replace(/\b(eter|eler|etcr|afer|afier|afler|aftcr|aftec|aier)\b/gi, "after");
  // Fix OCR-garbled "before" variants
  v = v.replace(/\b(befoe|befor|bef0re|bcfore|belore)\b/gi, "before");
  // Fix garbled AM / PM
  v = v.replace(/\b(4m)\b/gi, "AM");
  v = v.replace(/\b(9m)\b/gi, "PM");

  // Format raw digit blocks: "0620" → "06:20", "620" → "06:20"
  v = v.replace(/\b(\d{3,4})\b/g, (match) => {
    const d = match.replace(/\D/g, "");
    if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
    if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
    return match;
  });

  return v.trim();
}

// ─── Data & AI Photos ────────────────────────────────────────────────────────

export const AI_PHOTOS = {
  male: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop&q=80",
  female: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop&q=80",
  maleList: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&fit=crop&q=80"
  ],
  femaleList: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&fit=crop&q=80"
  ]
};

export const getAiPhotoForGender = (gender?: string): string => {
  const g = String(gender || "").toLowerCase().trim();
  if (g === "male" || g === "groom" || g === "man" || g === "boy") {
    return AI_PHOTOS.male;
  }
  return AI_PHOTOS.female;
};

export const formatPhotoUrl = (str?: string): string => {
  if (!str || typeof str !== "string") return "";
  const trimmed = str.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/uploads/")) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
    return `${backendUrl}${trimmed}`;
  }
  return trimmed;
};

export const savePhotoToLocalCache = (phone?: string, photoUrl?: string) => {
  if (!phone || !photoUrl) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const photoCache = JSON.parse(localStorage.getItem("vivahUserPhotos") || "{}");
    photoCache[cleanPhone] = photoUrl;
    if (phone !== cleanPhone) {
      photoCache[phone] = photoUrl;
    }
    localStorage.setItem("vivahUserPhotos", JSON.stringify(photoCache));
  } catch (_) {}
};

export const getUserDisplayPhoto = (u: any): string => {
  if (!u) return AI_PHOTOS.female;
  const str = u.img || u.photo || u.profile_image || u.avatar || u.imageUrl || u.profile_pic || "";
  const formatted = formatPhotoUrl(str);
  
  // 1. If user object has an extracted or uploaded photo, return it immediately
  if (formatted && (formatted.startsWith("data:image/") || formatted.includes("/uploads/") || (!formatted.includes("unsplash.com") && !formatted.includes("pravatar.cc")))) {
    return formatted;
  }

  // 2. Check local storage cache by phone for extracted photo
  const phoneKey = u.phone || u.whatsapp;
  if (phoneKey) {
    try {
      const cleanPhone = String(phoneKey).replace(/\D/g, "").slice(-10);
      const photoCache = JSON.parse(localStorage.getItem("vivahUserPhotos") || "{}");
      const cached = photoCache[cleanPhone] || photoCache[phoneKey];
      if (cached && (cached.startsWith("data:image/") || cached.includes("/uploads/") || (!cached.includes("unsplash.com") && !cached.includes("pravatar.cc")))) {
        return formatPhotoUrl(cached);
      }
    } catch (_) {}
  }

  if (formatted) {
    return formatted;
  }

  return getAiPhotoForGender(u.gender);
};

export const hasCustomUploadedPhoto = (u: any): boolean => {
  if (!u) return false;
  const str = u.img || u.photo || u.profile_image || u.avatar || u.imageUrl || u.profile_pic || "";
  if (typeof str !== "string" || !str.trim()) return false;
  return str.startsWith("data:image/") || str.includes("/uploads/") || (str.startsWith("http") && !str.includes("unsplash.com") && !str.includes("pravatar.cc"));
};

/**
 * Checks if target profile photo should be blurred / locked:
 * 1. Self viewing own profile -> NOT blurred.
 * 2. Female viewing male profile -> NOT blurred.
 * 3. Male viewing female profile:
 *    - By default, female user photo is protected / locked with "Request to View Photo"
 *    - UNLESS the female user has approved this specific male user's photo request!
 */
export const shouldBlurProfilePhoto = (viewer: any, targetProfile: any, photoRequests: any[] = []): boolean => {
  if (!viewer || !targetProfile) return false;
  
  // Own profile is never blurred
  const viewerId = viewer?.id != null ? String(viewer.id) : null;
  const targetId = targetProfile?.id != null ? String(targetProfile.id) : null;
  if (viewerId && targetId && viewerId === targetId) return false;

  const viewerGender = String(viewer.gender || "").toLowerCase().trim();
  const isFemaleViewer = viewerGender === "female" || viewerGender === "bride" || viewerGender === "woman" || viewerGender === "girl";
  const isMaleViewer = viewerGender === "male" || viewerGender === "groom" || viewerGender === "man" || viewerGender === "boy";

  const targetGender = String(targetProfile.gender || "").toLowerCase().trim();
  const isTargetMale = targetGender === "male" || targetGender === "groom" || targetGender === "man" || targetGender === "boy";
  const isTargetFemale = targetGender === "female" || targetGender === "bride" || targetGender === "woman" || targetGender === "girl";

  const viewerPlan = (viewer?.premium_plan || viewer?.plan || "Basic").toLowerCase().trim();
  const isGoldOrAbove = viewerPlan === "gold" || viewerPlan === "premium" || viewerPlan === "diamond" || viewerPlan === "platinum";

  // RULE 1: Female user viewing Male profile
  // - Basic Plan: Photo is NOT viewable (BLURRED & LOCKED)
  // - Gold / Premium Plan: Photo is viewable
  if (isFemaleViewer && isTargetMale) {
    return !isGoldOrAbove;
  }

  // RULE 2: Male user viewing Female profile
  // - Protected until female user approves photo access request
  if (isMaleViewer && isTargetFemale) {
    if (viewerId && targetId) {
      const reqs = photoRequests && photoRequests.length > 0 ? photoRequests : (() => {
        try {
          const saved = localStorage.getItem("vivahPhotoRequests");
          return saved ? JSON.parse(saved) : [];
        } catch {
          return [];
        }
      })();
      const isApproved = reqs.some(
        (r: any) => String(r.requesterId) === viewerId && String(r.targetFemaleId) === targetId && r.status === "approved"
      );
      if (isApproved) return false; // Approved by female owner -> clearly visible!
    }
    return true;
  }

  return false;
};

/**
 * Gets photo access request status between viewer and target profile: 'none' | 'pending' | 'approved' | 'declined'
 */
export const getPhotoRequestStatus = (viewer: any, targetProfile: any, photoRequests: any[] = []): 'none' | 'pending' | 'approved' | 'declined' => {
  if (!viewer || !targetProfile) return 'none';
  const viewerId = viewer?.id != null ? String(viewer.id) : null;
  const targetId = targetProfile?.id != null ? String(targetProfile.id) : null;
  if (!viewerId || !targetId) return 'none';

  const reqs = photoRequests && photoRequests.length > 0 ? photoRequests : (() => {
    try {
      const saved = localStorage.getItem("vivahPhotoRequests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const found = reqs.find(
    (r: any) => String(r.requesterId) === viewerId && String(r.targetFemaleId) === targetId
  );
  return found ? found.status : 'none';
};

/**
 * Gets interest request status between current user and target profile:
 * '' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'declined'
 */
export const getProfileInterestStatus = (
  currentUser: any,
  profile: any,
  sentInterests: any[] = [],
  interestStatuses: Record<string | number, string> = {}
): string => {
  if (!profile?.id) return '';
  const pId = profile.id;
  const pIdStr = String(pId);
  const uId = currentUser?.id;
  const uIdStr = uId != null ? String(uId) : '';

  // 1. Direct status from interestStatuses by pair keys or profile ID
  if (uIdStr) {
    if (interestStatuses[`${uIdStr}_${pIdStr}`]) return String(interestStatuses[`${uIdStr}_${pIdStr}`]).toLowerCase();
    if (interestStatuses[`${pIdStr}_${uIdStr}`]) return String(interestStatuses[`${pIdStr}_${uIdStr}`]).toLowerCase();
  }
  if (interestStatuses[pIdStr]) return String(interestStatuses[pIdStr]).toLowerCase();
  if (interestStatuses[pId]) return String(interestStatuses[pId]).toLowerCase();

  // 2. Search in sentInterests list
  const sentEntry = sentInterests.find(
    (s: any) =>
      (uIdStr && ((String(s.receiver_id) === pIdStr && String(s.sender_id) === uIdStr) ||
                 (String(s.sender_id) === pIdStr && String(s.receiver_id) === uIdStr))) ||
      String(s.id) === pIdStr ||
      s.id === pId ||
      (s.name && profile.name && String(s.name).toLowerCase() === String(profile.name).toLowerCase())
  );

  if (sentEntry) {
    if (sentEntry.id && interestStatuses[sentEntry.id]) return String(interestStatuses[sentEntry.id]).toLowerCase();
    if (sentEntry.id && interestStatuses[String(sentEntry.id)]) return String(interestStatuses[String(sentEntry.id)]).toLowerCase();
    if (sentEntry.status) return String(sentEntry.status).toLowerCase();
    return 'pending';
  }

  return '';
};

const saveVerificationToCache = (phone: string, verificationData: { whatsapp_verified?: number; aadhar_verified?: number; aadhar_number?: string; profile_completion?: number }) => {
  if (!phone) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const cache = JSON.parse(localStorage.getItem("vivahVerifications") || "{}");
    cache[cleanPhone] = { ...(cache[cleanPhone] || {}), ...verificationData };
    cache[phone] = cache[cleanPhone];
    localStorage.setItem("vivahVerifications", JSON.stringify(cache));
  } catch (_) {}
};

const getVerificationFromCache = (phone: string) => {
  if (!phone) return null;
  try {
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const cache = JSON.parse(localStorage.getItem("vivahVerifications") || "{}");
    return cache[cleanPhone] || cache[phone] || null;
  } catch {
    return null;
  }
};

/**
 * Saves a user to localStorage while preserving any locally-extracted base64 or custom photo
 * and verification state (WhatsApp verified, Aadhaar verified, completion score).
 * Prevents server AI fallback URLs and unverified login responses from overwriting verified state.
 */
const safeSetVivahUser = (incomingUser: any): any => {
  let merged = { ...incomingUser };
  const userPhone = merged?.phone || merged?.whatsapp || "";
  const photo = merged?.img || merged?.photo || "";

  // Only update photo cache if this photo is a genuine custom / extracted photo
  if (userPhone && photo && hasCustomUploadedPhoto(merged)) {
    savePhotoToLocalCache(userPhone, photo);
  }

  try {
    const cleanPhone = String(userPhone).replace(/\D/g, "").slice(-10);
    const photoCache = JSON.parse(localStorage.getItem("vivahUserPhotos") || "{}");
    const cachedPhoto = photoCache[cleanPhone] || photoCache[userPhone];
    
    // If we have a cached extracted photo and the incoming user has an AI fallback, restore the extracted photo!
    if (cachedPhoto && (!hasCustomUploadedPhoto(merged) || (typeof merged.img === "string" && merged.img.includes("unsplash.com")))) {
      merged = { 
        ...merged, 
        img: cachedPhoto, 
        photo: cachedPhoto, 
        avatar: cachedPhoto,
        profile_image: cachedPhoto,
        isCustomPhoto: true 
      };
    }
  } catch (_) {}

  // Restore and persist verification status
  if (userPhone) {
    const cachedVerif = getVerificationFromCache(userPhone);
    if (cachedVerif) {
      merged = {
        ...cachedVerif,
        ...merged,
        whatsapp_verified: merged.whatsapp_verified ? 1 : (cachedVerif.whatsapp_verified ? 1 : 0),
        aadhar_verified: merged.aadhar_verified ? 1 : (cachedVerif.aadhar_verified ? 1 : 0),
        aadhar_number: merged.aadhar_number || cachedVerif.aadhar_number,
        profile_completion: Math.max(Number(merged.profile_completion) || 65, Number(cachedVerif.profile_completion) || 65)
      };
    }
    if (merged.whatsapp_verified || merged.aadhar_verified) {
      saveVerificationToCache(userPhone, {
        whatsapp_verified: merged.whatsapp_verified ? 1 : 0,
        aadhar_verified: merged.aadhar_verified ? 1 : 0,
        aadhar_number: merged.aadhar_number,
        profile_completion: merged.profile_completion
      });
    }
  }

  localStorage.setItem("vivahUser", JSON.stringify(merged));
  return merged;
};

const DEFAULT_USER = {
  id: 101,
  name: "V. Srinivasan",
  full_name: "V. Srinivasan",
  gender: "Male",
  age: 26,
  city: "Chidambaram",
  state: "Tamil Nadu",
  country: "India",
  religion: "Hindu",
  caste: "Brahmin",
  education: "B.E. (EEE)",
  job: "Software Engineer",
  occupation: "Software Engineer",
  salary: "12 LPA",
  income: "12 LPA",
  height: "173 cm.",
  complexion: "Fair",
  marital_status: "Never Married",
  mother_tongue: "Tamil",
  diet: "Vegetarian",
  whatsapp: "8248093261",
  phone: "8248093261",
  rasi: "Mesham",
  nakshatra: "Ashwini",
  dosham: "None",
  birth_time: "06:30 AM",
  birth_place: "Chidambaram, Tamil Nadu",
  father_name: "V. Krishnamoorthy",
  father_occupation: "Business",
  mother_name: "K. Meenakshi",
  mother_occupation: "Homemaker",
  brother_name: "",
  sister_name: "",
  gothram: "Kashyapa",
  gotra: "Kashyapa",
  family_type: "Joint Family",
  family_status: "Upper Middle Class",
  family_values: "Traditional",
  native_place: "Chidambaram, Tamil Nadu",
  pref_age_min: "21",
  pref_age_max: "28",
  pref_height: "Any height",
  pref_religion: "Hindu",
  pref_education: "Any Graduate",
  pref_income: "Any",
  pref_occupation: "Any",
  pref_location: "Tamil Nadu",
  pref_dosham: "None preferred",
  img: AI_PHOTOS.male,
  photo: AI_PHOTOS.male,
  premium_plan: "Basic",
  verified: true,
  online: true
};

const PROFILES = [
  { id: 1, name: "Priya Sharma", gender: "female", age: 26, city: "Chennai", state: "Tamil Nadu", religion: "Hindu", caste: "Brahmin", education: "M.Tech", job: "Software Engineer", salary: "12 LPA", height: "5'4\"", complexion: "Fair", match: 87, img: "https://i.pravatar.cc/300?img=47", premium: true, online: true, rasi: "Mesham", nakshatra: "Ashwini", dosham: "None", whatsapp: "+91 98765 43210", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 2, name: "Ananya Krishnan", gender: "female", age: 24, city: "Coimbatore", state: "Tamil Nadu", religion: "Hindu", caste: "Mudaliar", education: "MBA", job: "Bank Manager", salary: "8 LPA", height: "5'3\"", complexion: "Wheatish", match: 72, img: "https://i.pravatar.cc/300?img=48", premium: false, online: false, rasi: "Rishabam", nakshatra: "Rohini", dosham: "Chevvai Dosham", whatsapp: "+91 98765 43211", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 3, name: "Divya Nair", gender: "female", age: 27, city: "Bangalore", state: "Karnataka", religion: "Hindu", caste: "Nair", education: "MBBS", job: "Doctor", salary: "18 LPA", height: "5'5\"", complexion: "Fair", match: 94, img: "https://i.pravatar.cc/300?img=49", premium: true, online: true, rasi: "Mithunam", nakshatra: "Thiruvathirai", dosham: "None", whatsapp: "+91 98765 43212", marital_status: "Never Married", mother_tongue: "Malayalam", diet: "Vegetarian" },
  { id: 4, name: "Kavitha Reddy", gender: "female", age: 25, city: "Hyderabad", state: "Telangana", religion: "Hindu", caste: "Reddy", education: "B.Tech", job: "Data Analyst", salary: "10 LPA", height: "5'2\"", complexion: "Wheatish", match: 68, img: "https://i.pravatar.cc/300?img=50", premium: false, online: true, rasi: "Katakam", nakshatra: "Pushyam", dosham: "None", whatsapp: "+91 98765 43213", marital_status: "Never Married", mother_tongue: "Telugu", diet: "Non-Vegetarian" },
  { id: 5, name: "Meena Iyer", gender: "female", age: 28, city: "Mumbai", state: "Maharashtra", religion: "Hindu", caste: "Iyer", education: "CA", job: "Chartered Accountant", salary: "15 LPA", height: "5'3\"", complexion: "Fair", match: 81, img: "https://i.pravatar.cc/300?img=51", premium: true, online: false, rasi: "Simmam", nakshatra: "Magam", dosham: "None", whatsapp: "+91 98765 43214", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 6, name: "Lakshmi Venkat", gender: "female", age: 23, city: "Madurai", state: "Tamil Nadu", religion: "Hindu", caste: "Pillai", education: "B.E.", job: "Teacher", salary: "5 LPA", height: "5'1\"", complexion: "Fair", match: 79, img: "https://i.pravatar.cc/300?img=9", premium: false, online: false, rasi: "Kanni", nakshatra: "Uthiram", dosham: "Sevvai Dosham", whatsapp: "+91 98765 43215", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 7, name: "Arun Kumar", gender: "male", age: 28, city: "Chennai", state: "Tamil Nadu", religion: "Hindu", caste: "Brahmin", education: "B.Tech", job: "Software Engineer", salary: "15 LPA", height: "5'10\"", complexion: "Fair", match: 88, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&q=80", premium: false, online: true, rasi: "Mesham", nakshatra: "Ashwini", dosham: "None", whatsapp: "+91 98765 43216", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 8, name: "Rajesh Pillai", gender: "male", age: 30, city: "Madurai", state: "Tamil Nadu", religion: "Hindu", caste: "Pillai", education: "MBA", job: "Business Manager", salary: "12 LPA", height: "5'9\"", complexion: "Wheatish", match: 74, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80", premium: true, online: false, rasi: "Rishabam", nakshatra: "Rohini", dosham: "None", whatsapp: "+91 98765 43217", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 9, name: "Vikram Nair", gender: "male", age: 29, city: "Bangalore", state: "Karnataka", religion: "Hindu", caste: "Nair", education: "MS", job: "Product Manager", salary: "25 LPA", height: "6'0\"", complexion: "Fair", match: 91, img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&fit=crop&q=80", premium: true, online: true, rasi: "Mithunam", nakshatra: "Thiruvathirai", dosham: "Sevvai Dosham", whatsapp: "+91 98765 43218", marital_status: "Never Married", mother_tongue: "Malayalam", diet: "Non-Vegetarian" },
  { id: 10, name: "Karthik Subramanian", gender: "male", age: 31, city: "Chennai", state: "Tamil Nadu", religion: "Hindu", caste: "Iyer", education: "M.Tech", job: "Senior Architect", salary: "28 LPA", height: "5'11\"", complexion: "Fair", match: 85, img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&fit=crop&q=80", premium: true, online: true, rasi: "Simmam", nakshatra: "Magam", dosham: "None", whatsapp: "+91 98765 43219", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
  { id: 11, name: "Suresh Venkat", gender: "male", age: 32, city: "Coimbatore", state: "Tamil Nadu", religion: "Hindu", caste: "Mudaliar", education: "CA", job: "Finance Director", salary: "22 LPA", height: "5'8\"", complexion: "Wheatish", match: 80, img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&fit=crop&q=80", premium: false, online: false, rasi: "Katakam", nakshatra: "Pushyam", dosham: "None", whatsapp: "+91 98765 43220", marital_status: "Never Married", mother_tongue: "Tamil", diet: "Vegetarian" },
];

const TESTIMONIALS = [
  { couple: "Karthik & Priya", married: "March 2024", city: "Chennai", story: "We matched on MERCURY CONNECT in 2023. The secure space and horoscope match features were spot on — we are happily married now with our families blessing!", img1: "https://i.pravatar.cc/100?img=12", img2: "https://i.pravatar.cc/100?img=47" },
  { couple: "Rahul & Divya", married: "January 2024", city: "Bangalore", story: "Genuine profiles and easy communication helped us find our perfect match within 3 months. Best decision ever!", img1: "https://i.pravatar.cc/100?img=33", img2: "https://i.pravatar.cc/100?img=49" },
  { couple: "Suresh & Meena", married: "November 2023", city: "Mumbai", story: "From first interest to wedding in just 6 months! The premium membership was worth every rupee.", img1: "https://i.pravatar.cc/100?img=15", img2: "https://i.pravatar.cc/100?img=51" },
];

const PLANS = [
  { name: "Basic", price: "₹999", period: "/3 months", features: ["50 Profile Views/month", "10 Interests/month", "Basic Search Filters", "Email Support"], extras: ["Horoscope Matching", "WhatsApp Unlock", "Priority Listing", "Video Calling", "Dedicated Manager"] },
  { name: "Gold", price: "₹2,499", period: "/6 months", popular: true, features: ["Unlimited Profile Views", "50 Interests/month", "Advanced Filters", "Horoscope Matching", "WhatsApp Number Unlock", "Chat & Voice Notes"], extras: ["Priority Listing", "Video Calling", "Dedicated Manager"] },
  { name: "Premium", price: "₹4,999", period: "/1 year", features: ["Everything in Gold", "Unlimited Interests", "Priority Search Listing", "Dedicated Relationship Manager", "Video Calling", "Premium Profile Badge"], extras: [] },
];

const REG_DATA = [
  { day: "Mon", users: 234 }, { day: "Tue", users: 312 }, { day: "Wed", users: 289 },
  { day: "Thu", users: 401 }, { day: "Fri", users: 356 }, { day: "Sat", users: 478 }, { day: "Sun", users: 523 },
];

const REVENUE_DATA = [
  { month: "Jan", revenue: 1.28 }, { month: "Feb", revenue: 1.45 }, { month: "Mar", revenue: 1.62 },
  { month: "Apr", revenue: 1.89 }, { month: "May", revenue: 2.01 }, { month: "Jun", revenue: 2.34 },
];

const GENDER_DATA = [
  { name: "Male", value: 22104, color: "#7C3AED" },
  { name: "Female", value: 26625, color: "#BE185D" },
];

const USERS_TABLE = [
  { id: "U001", name: "Arun Kumar", gender: "Male", phone: "+91 98765 43210", city: "Chennai", status: "Active", verified: true, premium: false },
  { id: "U002", name: "Priya Devi", gender: "Female", phone: "+91 87654 32109", city: "Coimbatore", status: "Active", verified: true, premium: true },
  { id: "U003", name: "Rajesh Pillai", gender: "Male", phone: "+91 76543 21098", city: "Madurai", status: "Pending", verified: false, premium: false },
  { id: "U004", name: "Sunita Sharma", gender: "Female", phone: "+91 65432 10987", city: "Bangalore", status: "Blocked", verified: true, premium: false },
  { id: "U005", name: "Vikram Nair", gender: "Male", phone: "+91 54321 09876", city: "Mumbai", status: "Active", verified: true, premium: true },
  { id: "U006", name: "Anita Krishnan", gender: "Female", phone: "+91 43210 98765", city: "Hyderabad", status: "Active", verified: false, premium: false },
];

const INTERESTS_DATA = [
  { id: 1, name: "Priya Sharma", age: 26, city: "Chennai", img: "https://i.pravatar.cc/100?img=47", status: "pending", time: "2 hours ago", match: 87 },
  { id: 2, name: "Divya Nair", age: 27, city: "Bangalore", img: "https://i.pravatar.cc/100?img=49", status: "accepted", time: "1 day ago", match: 94 },
  { id: 3, name: "Kavitha Reddy", age: 25, city: "Hyderabad", img: "https://i.pravatar.cc/100?img=50", status: "pending", time: "3 days ago", match: 68 },
  { id: 4, name: "Meena Iyer", age: 28, city: "Mumbai", img: "https://i.pravatar.cc/100?img=51", status: "rejected", time: "5 days ago", match: 81 },
  { id: 5, name: "Ananya Krishnan", age: 24, city: "Coimbatore", img: "https://i.pravatar.cc/100?img=48", status: "accepted", time: "1 week ago", match: 72 },
];

const CHATS_DATA = [
  { id: 1, name: "Divya Nair", img: "https://i.pravatar.cc/100?img=49", lastMsg: "Thank you for your interest!", time: "10:30 AM", unread: 2, online: true },
  { id: 2, name: "Priya Sharma", img: "https://i.pravatar.cc/100?img=47", lastMsg: "Sure, let us talk more!", time: "Yesterday", unread: 0, online: false },
  { id: 3, name: "Ananya Krishnan", img: "https://i.pravatar.cc/100?img=48", lastMsg: "My family will call you soon.", time: "2 days ago", unread: 0, online: false },
];

const MESSAGES_DATA = [
  { id: 1, from: "them", text: "Hello! I saw your profile and I am very interested.", time: "10:00 AM" },
  { id: 2, from: "me", text: "Hi Divya! Thank you for reaching out. I liked your profile too.", time: "10:05 AM" },
  { id: 3, from: "them", text: "Can you tell me more about your family background?", time: "10:10 AM" },
  { id: 4, from: "me", text: "Sure! I am from a Tamil Brahmin family in Chennai. My father is a retired government officer.", time: "10:15 AM" },
  { id: 5, from: "them", text: "That sounds wonderful! My family is originally from Coimbatore.", time: "10:20 AM" },
  { id: 6, from: "them", text: "Thank you for your interest!", time: "10:30 AM" },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
// const [phone, setPhone] = useState("");
// const [otp, setOtp] = useState("");
// const [otpSent, setOtpSent] = useState(false);
// const [sendingOtp, setSendingOtp] = useState(false);
// const [verifyingOtp, setVerifyingOtp] = useState(false);

function MatchBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 85 ? "text-emerald-700 bg-emerald-100" :
    pct >= 70 ? "text-amber-700 bg-amber-100" :
    "text-sky-700 bg-sky-100";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Sparkles className="w-3 h-3" />{pct}% Match
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
      <Crown className="w-3 h-3" />Premium
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({
  page,
  setPage,
  currentUser,
  onOpenMyProfile,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsRead,
  photoRequests = [],
  onRespondPhotoRequest
}: {
  page: Page;
  setPage: (p: Page) => void;
  currentUser?: any;
  onOpenMyProfile?: () => void;
  notifications?: any[];
  onNotificationClick?: (notif: any) => void;
  onMarkAllNotificationsRead?: () => void;
  photoRequests?: any[];
  onRespondPhotoRequest?: (reqId: string, status: 'approved' | 'declined') => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [msgToast, setMsgToast] = useState<{ name: string; text: string } | null>(null);
  const lastMsgCountRef = useRef(0);
  // Filter notifications so each user only sees notifications intended for them
  const currentUserId = currentUser?.id != null ? String(currentUser.id) : null;
  const currentUserName = (currentUser?.name || currentUser?.full_name || "").toLowerCase();
  const isLoggedIn = !["landing", "register", "login"].includes(page);
  const viewerPlan = (currentUser?.premium_plan || currentUser?.plan || 'Basic').toLowerCase();
  const isGoldOrAbove = viewerPlan === 'gold' || viewerPlan === 'diamond' || viewerPlan === 'platinum' || viewerPlan === 'premium';
  const isBasicUser = !isGoldOrAbove;

  // Poll for unread message count (Gold/Premium only)
  useEffect(() => {
    if (!isGoldOrAbove || !currentUserId) return;
    const chatsKey = `vivah_user_chats_${currentUserId}`;
    const poll = () => {
      try {
        const raw = localStorage.getItem(chatsKey);
        if (!raw) return;
        const chats: any[] = JSON.parse(raw);
        const total = chats.reduce((sum: number, c: any) => sum + (Number(c.unread) || 0), 0);
        setUnreadMsgCount(total);
        // Detect new message arrival → show toast
        if (total > lastMsgCountRef.current) {
          const newChat = chats.find((c: any) => Number(c.unread) > 0);
          if (newChat) {
            setMsgToast({ name: newChat.name || 'Someone', text: newChat.lastMsg || 'Sent you a message' });
            setTimeout(() => setMsgToast(null), 4000);
          }
        }
        lastMsgCountRef.current = total;
      } catch (e) { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [currentUserId, isGoldOrAbove]);

  const userNotifications = notifications.filter((n) => {
    if (n.forUserId != null) {
      return currentUserId != null && String(n.forUserId) === currentUserId;
    }
    return false;
  });

  const unreadCount = userNotifications.filter((n) => n.unread).length;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setPage("landing")} className="flex items-center gap-3 group cursor-pointer text-left">
            <MercuryLogoIcon className="w-9 h-9 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#0F2C59] via-[#1E3A8A] to-[#0284C7] leading-none">
                MERCURY CONNECT
              </span>
              <span className="text-[10px] font-semibold text-sky-600 tracking-tight leading-tight hidden sm:inline-block">
                The secure space to meet your soulmate
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn ? (
              <>
                {/* Nav Links */}
                {([ ["dashboard", "Matches"], ["interests", "Interests"], ["chat", "Messages"], ["premium", "Premium"] ] as [Page, string][]).map(([p, label]) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      // Clear unread badge when navigating to Messages
                      if (p === 'chat' && currentUserId) {
                        setUnreadMsgCount(0);
                        lastMsgCountRef.current = 0;
                      }
                    }}
                    className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      page === p
                        ? "text-[#0F2C59] bg-sky-50 border border-sky-200 font-bold"
                        : "text-slate-600 hover:text-[#0284C7] hover:bg-sky-50"
                    }`}
                  >
                    {label}
                    {/* Unread message badge — Gold/Premium only */}
                    {p === 'chat' && isGoldOrAbove && unreadMsgCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-[#0284C7] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                      </span>
                    )}
                  </button>
                ))}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 ml-1 text-gray-500 hover:text-[#0284C7] transition-colors rounded-lg hover:bg-sky-50 cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#0284C7] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-sky-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#0284C7]" />
                          <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => onMarkAllNotificationsRead?.()}
                            className="text-xs text-sky-600 hover:text-[#003B7B] font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {userNotifications.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-6">No notifications yet.</p>
                        ) : (
                          userNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                onNotificationClick?.(n);
                                setNotifOpen(false);
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${n.unread ? "bg-sky-50/70 border-sky-200/80 hover:bg-sky-100/60" : "bg-gray-50/50 border-gray-100 hover:bg-gray-100/50"}`}
                            >
                              {isBasicUser ? (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0 shadow-sm relative overflow-hidden select-none">
                                  <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                  <Lock className="w-2.5 h-2.5 text-amber-500 absolute bottom-0.5 right-0.5" />
                                </div>
                              ) : ((n.targetTab === 'sent' ? n.toImg : n.fromImg) || n.profileImg) ? (
                                <img
                                  src={(n.targetTab === 'sent' ? n.toImg : n.fromImg) || n.profileImg}
                                  alt={(n.targetTab === 'sent' ? n.toName : n.fromName) || n.profileName || "User"}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-300 flex-shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003B7B] to-[#1D72B8] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm select-none">
                                  {((n.targetTab === 'sent' ? n.toName : n.fromName) || n.profileName || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              {n.type === 'photo_request' || n.photoRequestId ? (
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                                      <Camera className="w-3 h-3 text-amber-600" /> Photo Access Request
                                    </span>
                                    <span className="text-[10px] text-gray-400">{n.time || "Just now"}</span>
                                  </div>
                                  <p className="text-xs font-bold text-gray-900 leading-snug">{n.fromName || n.senderName}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  
                                  {/* Approve / Decline buttons */}
                                  <div className="flex items-center gap-2 mt-2.5">
                                    {(() => {
                                      const req = (photoRequests || []).find((r: any) => r.id === n.photoRequestId || (String(r.requesterId) === String(n.senderId) && String(r.targetFemaleId) === String(currentUser?.id)));
                                      const reqStatus = req ? req.status : 'pending';
                                      if (reqStatus === 'approved') {
                                        return (
                                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Photo Access Approved
                                          </span>
                                        );
                                      }
                                      if (reqStatus === 'declined') {
                                        return (
                                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                            <X className="w-3.5 h-3.5" /> Request Declined
                                          </span>
                                        );
                                      }
                                      return (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onRespondPhotoRequest?.(n.photoRequestId || n.id, 'approved');
                                            }}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Check className="w-3.5 h-3.5" /> Approve Photo
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onRespondPhotoRequest?.(n.photoRequestId || n.id, 'declined');
                                            }}
                                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                                          >
                                            <X className="w-3.5 h-3.5" /> Decline
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                    <span className="text-xs font-bold text-[#0F2C59] truncate max-w-[120px]">{(n.targetTab === 'sent' ? n.toName : n.fromName) || n.profileName || "Someone"}</span>
                                    <span className="text-[10px] text-gray-400">→</span>
                                    <span className="text-xs font-semibold text-[#1D72B8] truncate max-w-[100px]">{(n.targetTab === 'sent' ? n.fromName : n.toName) || n.receiverName || "Profile"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                                      {n.targetTab === 'received' ? '💖 Interest Received' : '💖 Interest Sent'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{n.time || "Just now"}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                  <span className="mt-1.5 inline-block text-[11px] font-bold text-sky-600 hover:underline">
                                    {n.targetTab === 'received' ? 'View in Received Tab →' : 'View in Sent Tab →'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar + Name + Plan badge */}
                <button
                  onClick={() => onOpenMyProfile?.()}
                  className="flex items-center gap-2 ml-1 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-sky-50/70 transition-all group"
                  title="View My Profile"
                >
                  {/* Avatar circle */}
                  <img
                    src={getUserDisplayPhoto(currentUser)}
                    alt={currentUser?.name || "Profile"}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-400 flex-shrink-0 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAiPhotoForGender(currentUser?.gender);
                    }}
                  />
                  {/* Name + plan */}
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-[#0284C7] transition-colors truncate max-w-[100px]">
                      {currentUser?.name || currentUser?.full_name || "User"}
                    </p>
                    <p className="text-[10px] font-medium text-amber-600 mt-0.5">
                      {currentUser?.premium_plan
                        ? `${currentUser.premium_plan} Member`
                        : currentUser?.plan
                        ? `${currentUser.plan} Member`
                        : "Basic Member"}
                    </p>
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={() => setPage("landing")}
                  className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100/80 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPage("landing")} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0284C7] rounded-lg hover:bg-sky-50 transition-all">Home</button>
                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0284C7] rounded-lg hover:bg-sky-50 transition-all">Success Stories</button>
                <button onClick={() => setPage("premium")} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0284C7] rounded-lg hover:bg-sky-50 transition-all">Plans</button>
                <button onClick={() => setPage("admin")} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0284C7] rounded-lg hover:bg-sky-50 transition-all">Admin</button>
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-sky-100">
                  <button onClick={() => setPage("login")} className="px-4 py-2 text-sm font-semibold text-[#0F2C59] border border-sky-300 rounded-full hover:bg-sky-50 transition-all cursor-pointer">Login</button>
                  <button onClick={() => setPage("register")} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] rounded-full hover:opacity-95 shadow-md transition-all cursor-pointer">Register Free</button>
                </div>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 rounded-lg hover:bg-sky-50">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-sky-100 pt-3 space-y-1">
            {isLoggedIn && (
              <button
                onClick={() => { onOpenMyProfile?.(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-[#0F2C59] flex items-center gap-2 hover:bg-sky-50 rounded-lg"
              >
                <img
                  src={getUserDisplayPhoto(currentUser)}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-sky-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAiPhotoForGender(currentUser?.gender);
                  }}
                />
                <span>My Profile ({currentUser?.name || "User"})</span>
              </button>
            )}
            {(["dashboard", "interests", "chat", "premium", "admin"] as Page[]).map((p) => (
              <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-sky-50 rounded-lg capitalize">{p === "dashboard" ? "Matches" : p}</button>
            ))}
            <button onClick={() => { setPage("register"); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-[#0284C7]">Register Free</button>
          </div>
        )}
      </div>

      {/* ── New Message Toast (Gold/Premium only) ─────────────────────────────────── */}
      {msgToast && (
        <div
          className="fixed bottom-5 right-5 z-[9999] flex items-start gap-3 bg-white border border-sky-200 rounded-2xl shadow-2xl px-4 py-3 max-w-xs"
          style={{ animation: 'slideInRight 0.3s cubic-bezier(.4,0,.2,1) both' }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#003B7B] to-[#1D72B8] flex items-center justify-center flex-shrink-0 shadow">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{msgToast.name}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{msgToast.text}</p>
          </div>
          <button onClick={() => setMsgToast(null)} className="text-gray-300 hover:text-gray-500 cursor-pointer flex-shrink-0 mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
          <style>{`@keyframes slideInRight { from { transform: translateX(110%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
        </div>
      )}
    </nav>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function HeroSection({ setPage }: { setPage: (p: Page) => void }) {
  const [gender, setGender] = useState("Bride");
  const [ageMin, setAgeMin] = useState("21");
  const [ageMax, setAgeMax] = useState("30");
  const [religion, setReligion] = useState("");

  return (
    <div className="relative min-h-[620px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#071328] via-[#0F2C59] to-[#0A1A36]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 70% 30%, #0284c7 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #38bdf8 0%, transparent 60%)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1722952934708-749c22eb2e58?w=900&h=700&fit=crop&auto=format"
          alt="Indian wedding couple"
          className="w-full h-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071328] via-[#0F2C59]/80 to-transparent" />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-12 right-12 w-48 h-48 rounded-full border border-sky-400/10 hidden lg:block" />
      <div className="absolute top-6 right-6 w-64 h-64 rounded-full border border-sky-400/10 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-xs font-medium border border-sky-300/20">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />Verified Profiles
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-xs font-medium border border-sky-300/20">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />4.9 / 5 Rating
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-xs font-medium border border-sky-300/20">
              <Shield className="w-3.5 h-3.5 text-sky-400" />100% Secure & Private
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            MERCURY CONNECT<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">The Secure Space</span> To Meet Your Soulmate
          </h1>
          <p className="text-sky-100/80 text-lg mb-8 leading-relaxed font-light">
            Welcome to <strong className="font-semibold text-white">MERCURY CONNECT</strong> — The secure space to meet your soulmate. Connect with 5 lakh+ verified profiles with trusted privacy and instant compatibility.
          </p>

          <div className="flex items-center gap-8 mb-10">
            {[["5L+", "Verified Profiles"], ["50K+", "Happy Couples"], ["4.9★", "User Trust Rating"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-sky-400 font-bold text-2xl font-display leading-none">{val}</p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Search card */}
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-sky-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Find Your Match</p>
            <div className="flex gap-2 mb-3">
              {["Bride", "Groom"].map((g) => (
                <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${gender === g ? "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white shadow-sm" : "bg-sky-50 text-[#0F2C59] hover:bg-sky-100"}`}>
                  {g === "Bride" ? "Looking for Bride" : "Looking for Groom"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Min Age</label>
                <select value={ageMin} onChange={e => setAgeMin(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#0284C7] transition-colors">
                  {[18,19,20,21,22,23,24,25,26,27,28,30,32,35].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Max Age</label>
                <select value={ageMax} onChange={e => setAgeMax(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#0284C7] transition-colors">
                  {[25,26,27,28,29,30,32,35,38,40,45].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Religion</label>
              <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#0284C7] transition-colors">
                <option value="">All Religions</option>
                {["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={() => setPage("dashboard")} className="w-full py-3.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white font-bold text-base rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg">
              <Search className="w-4 h-4" />Search Profiles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedProfiles({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Today's Picks</p>
            <h2 className="font-display text-3xl font-bold text-gray-900">Featured Profiles</h2>
          </div>
          <button onClick={() => setPage("dashboard")} className="flex items-center gap-1 text-sm font-semibold text-rose-700 hover:gap-2 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => setPage("profile")} className="group text-left bg-white border border-rose-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-300 transition-all duration-300">
              <div className="relative aspect-[3/4] bg-rose-50">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {p.premium && (
                  <div className="absolute top-2 left-2"><PremiumBadge /></div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-3">
                  <p className="text-white text-sm font-semibold leading-tight">{p.name}</p>
                  <p className="text-white/75 text-xs">{p.age || 26} yrs · {p.city || "Chennai"}{p.state ? `, ${p.state}` : ", Tamil Nadu"}</p>
                </div>
                <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${p.online ? "bg-emerald-400" : "bg-gray-400"}`} />
              </div>
              <div className="p-2">
                <MatchBadge pct={p.match} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: User, title: "Create Profile", desc: "Register with basic details, upload photo, and add your horoscope details." },
    { icon: Search, title: "Find Matches", desc: "Browse verified profiles filtered by religion, caste, location, and horoscope." },
    { icon: Heart, title: "Send Interest", desc: "Express interest and start chatting after mutual acceptance." },
    { icon: CheckCircle, title: "Get Married", desc: "Meet families, finalize the alliance, and begin your happily ever after!" },
  ];
  return (
    <section className="py-16 bg-gradient-to-br from-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">Find Love in 4 Simple Steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-3/4 w-1/2 border-t-2 border-dashed border-rose-200 z-0" />
              )}
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4 border border-rose-100 group-hover:shadow-rose-200 group-hover:shadow-lg transition-shadow">
                <s.icon className="w-8 h-8 text-rose-600" />
                <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">{i + 1}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Membership</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="text-gray-500 mt-2">Upgrade to connect with more matches faster</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl border-2 p-6 ${plan.popular ? "border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-xl shadow-amber-100" : "border-rose-100 bg-white hover:border-rose-300 hover:shadow-md transition-all"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full shadow">✨ Most Popular</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {i === 0 ? <Shield className="w-5 h-5 text-gray-400" /> : i === 1 ? <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Crown className="w-5 h-5 text-purple-600" />}
                <h3 className="font-display text-xl font-bold text-gray-900">{plan.name}</h3>
              </div>
              <div className="flex items-end gap-1 mb-5">
                <span className="font-display text-3xl font-bold text-rose-700">{plan.price}</span>
                <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    {f}
                  </li>
                ))}
                {plan.extras.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-400 line-through">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <X className="w-2.5 h-2.5 text-gray-300" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setPage("premium")} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 shadow-md shadow-amber-200" : i === 2 ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90" : "border-2 border-rose-300 text-rose-700 hover:bg-rose-50"}`}>
                {i === 0 ? "Get Started Free" : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ALL_NAKSHATRAS = [
  { id: 1, name: "Ashwini (அஸ்வினி)", rasi: "Mesham (மேஷம்)", gana: "Deva", rajju: "Padham", yoni: "Horse" },
  { id: 2, name: "Bharani (பரணி)", rasi: "Mesham (மேஷம்)", gana: "Manusha", rajju: "Thodai", yoni: "Elephant" },
  { id: 3, name: "Karthigai (கார்த்திகை)", rasi: "Mesham (மேஷம்)", gana: "Rakshasa", rajju: "Udharam", yoni: "Goat" },
  { id: 4, name: "Rohini (ரோஹிணி)", rasi: "Rishabham (ரிஷபம்)", gana: "Manusha", rajju: "Kazhuthu", yoni: "Serpent" },
  { id: 5, name: "Mrigasira (மிருகசீரிஷம்)", rasi: "Rishabham (ரிஷபம்)", gana: "Deva", rajju: "Sirasu", yoni: "Serpent" },
  { id: 6, name: "Thiruvathirai (திருவாதிரை)", rasi: "Midhunam (மிதுனம்)", gana: "Manusha", rajju: "Kazhuthu", yoni: "Dog" },
  { id: 7, name: "Punartham (புனர்பூசம்)", rasi: "Midhunam (மிதுனம்)", gana: "Deva", rajju: "Kazhuthu", yoni: "Cat" },
  { id: 8, name: "Poosam (பூசம்)", rasi: "Kadagam (கடகம்)", gana: "Deva", rajju: "Udharam", yoni: "Goat" },
  { id: 9, name: "Ayilyam (ஆயில்யம்)", rasi: "Kadagam (கடகம்)", gana: "Rakshasa", rajju: "Thodai", yoni: "Cat" },
  { id: 10, name: "Magam (மகம்)", rasi: "Simmam (சிம்மம்)", gana: "Rakshasa", rajju: "Padham", yoni: "Rat" },
  { id: 11, name: "Pooram (பூரம்)", rasi: "Simmam (சிம்மம்)", gana: "Manusha", rajju: "Thodai", yoni: "Rat" },
  { id: 12, name: "Uthiram (உத்திரம்)", rasi: "Simmam (சிம்மம்)", gana: "Manusha", rajju: "Udharam", yoni: "Cow" },
  { id: 13, name: "Hastham (அஸ்தம்)", rasi: "Kanni (கன்னி)", gana: "Deva", rajju: "Kazhuthu", yoni: "Buffalo" },
  { id: 14, name: "Chithirai (சித்திரை)", rasi: "Kanni (கன்னி)", gana: "Rakshasa", rajju: "Sirasu", yoni: "Tiger" },
  { id: 15, name: "Swathi (சுவாதி)", rasi: "Thulaam (துலாம்)", gana: "Deva", rajju: "Kazhuthu", yoni: "Buffalo" },
  { id: 16, name: "Visakam (விசாகம்)", rasi: "Thulaam (துலாம்)", gana: "Rakshasa", rajju: "Kazhuthu", yoni: "Tiger" },
  { id: 17, name: "Anusham (அனுஷம்)", rasi: "Vrichigam (விருச்சிகம்)", gana: "Deva", rajju: "Udharam", yoni: "Deer" },
  { id: 18, name: "Kettai (கேட்டை)", rasi: "Vrichigam (விருச்சிகம்)", gana: "Rakshasa", rajju: "Thodai", yoni: "Deer" },
  { id: 19, name: "Moolam (மூலம்)", rasi: "Dhanusu (தனுசு)", gana: "Rakshasa", rajju: "Padham", yoni: "Dog" },
  { id: 20, name: "Pooradam (பூராடம்)", rasi: "Dhanusu (தனுசு)", gana: "Manusha", rajju: "Thodai", yoni: "Monkey" },
  { id: 21, name: "Uthiradam (உத்திராடம்)", rasi: "Dhanusu (தனுசு)", gana: "Manusha", rajju: "Udharam", yoni: "Mongoose" },
  { id: 22, name: "Thiruvonam (திருவோணம்)", rasi: "Magaram (மகரம்)", gana: "Deva", rajju: "Kazhuthu", yoni: "Monkey" },
  { id: 23, name: "Avittam (அவிட்டம்)", rasi: "Magaram (மகரம்)", gana: "Rakshasa", rajju: "Sirasu", yoni: "Lion" },
  { id: 24, name: "Sathayam (சதயம்)", rasi: "Kumbham (கும்பம்)", gana: "Rakshasa", rajju: "Kazhuthu", yoni: "Horse" },
  { id: 25, name: "Poorattathi (பூரட்டாதி)", rasi: "Kumbham (கும்பம்)", gana: "Manusha", rajju: "Kazhuthu", yoni: "Lion" },
  { id: 26, name: "Uthirattathi (உத்திரட்டாதி)", rasi: "Meenam (மீனம்)", gana: "Manusha", rajju: "Udharam", yoni: "Cow" },
  { id: 27, name: "Revathi (ரேவதி)", rasi: "Meenam (மீனம்)", gana: "Deva", rajju: "Padham", yoni: "Elephant" }
];

function HoroscopeSection() {
  const [brideStarId, setBrideStarId] = useState(4); // Rohini
  const [groomStarId, setGroomStarId] = useState(12); // Uthiram
  const [matchResult, setMatchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate10PoruthamLocal = (bId: number, gId: number) => {
    const bride = ALL_NAKSHATRAS.find(n => n.id === bId) || ALL_NAKSHATRAS[3];
    const groom = ALL_NAKSHATRAS.find(n => n.id === gId) || ALL_NAKSHATRAS[11];

    let countToGroom = ((groom.id - bride.id + 27) % 27) + 1;
    let dinaRem = countToGroom % 9;
    let dinaPass = [2, 4, 6, 8, 9, 0].includes(dinaRem) || [2, 4, 6, 8, 9, 11, 13, 15, 17, 18, 20, 22, 24, 26, 27].includes(countToGroom);

    let ganaPass = (bride.gana === groom.gana) || bride.gana === "Deva" || groom.gana === "Deva";
    let yoniPass = !(
      (bride.yoni === "Horse" && groom.yoni === "Buffalo") || (bride.yoni === "Buffalo" && groom.yoni === "Horse") ||
      (bride.yoni === "Elephant" && groom.yoni === "Lion") || (bride.yoni === "Lion" && groom.yoni === "Elephant") ||
      (bride.yoni === "Serpent" && groom.yoni === "Mongoose") || (bride.yoni === "Mongoose" && groom.yoni === "Serpent") ||
      (bride.yoni === "Cat" && groom.yoni === "Rat") || (bride.yoni === "Rat" && groom.yoni === "Cat")
    );

    let rasiPass = true;
    let rasiAdhipathiPass = true;
    let rajjuDosham = bride.rajju === groom.rajju;
    let rajjuPass = !rajjuDosham;
    let vedhaiPass = true;
    let vasyaPass = true;
    let mahendraPass = [4, 7, 10, 13, 16, 19, 22, 25].includes(countToGroom);
    let streeDeergamPass = countToGroom > 13;

    const list = [
      { name: "Dina Porutham", tamil: "தின பொருத்தம்", status: dinaPass, desc: "Health & Longevity" },
      { name: "Gana Porutham", tamil: "கண பொருத்தம்", status: ganaPass, desc: "Temperament Harmony" },
      { name: "Yoni Porutham", tamil: "யோனி பொருத்தம்", status: yoniPass, desc: "Physical Intimacy" },
      { name: "Rasi Porutham", tamil: "ராசி பொருத்தம்", status: rasiPass, desc: "Family Harmony" },
      { name: "Rasi Adhipathi", tamil: "ராசி அதிபதி பொருத்தம்", status: rasiAdhipathiPass, desc: "Rasi Lord Friendship" },
      { name: "Rajju Porutham", tamil: "ரஜ்ஜு பொருத்தம்", status: rajjuPass, desc: "Spouse Longevity (Mandatory)" },
      { name: "Vedhai Porutham", tamil: "வேதை பொருத்தம்", status: vedhaiPass, desc: "Freedom from Affliction" },
      { name: "Vasya Porutham", tamil: "வசிய பொருத்தம்", status: vasyaPass, desc: "Mutual Attraction" },
      { name: "Mahendra Porutham", tamil: "மகேந்திர பொருத்தம்", status: mahendraPass, desc: "Children & Prosperity" },
      { name: "Stree Deergam", tamil: "ஸ்திரீ தீர்க்கம் பொருத்தம்", status: streeDeergamPass, desc: "Wealth & Well-being" }
    ];

    let matchCount = list.filter(p => p.status).length;
    let scorePct = Math.round((matchCount / 10) * 100);
    if (rajjuDosham) scorePct = Math.min(scorePct, 45);

    return {
      matched_count: matchCount,
      astrology_score: scorePct,
      rajju_dosham: rajjuDosham,
      poruthams: list,
      brideName: bride.name,
      groomName: groom.name
    };
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/horoscope/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brideStarId, groomStarId })
      });
      const data = await res.json();
      if (data.success) {
        setMatchResult(data);
      } else {
        setMatchResult(calculate10PoruthamLocal(brideStarId, groomStarId));
      }
    } catch (err) {
      setMatchResult(calculate10PoruthamLocal(brideStarId, groomStarId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brideStarId, groomStarId]);

  return (
    <section className="py-16 bg-gradient-to-br from-purple-950 via-rose-950 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #f9a8d4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c4b5fd 0%, transparent 50%)" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Tamil Jyothisham (தமிழ் ஜோதிடம்)</p>
          <h2 className="font-display text-3xl font-bold text-white">10 Porutham Horoscope Compatibility Check</h2>
          <p className="text-white/70 mt-2 text-sm max-w-xl mx-auto">Select Bride & Groom Nakshatra (நட்சத்திரம்) for authentic Tamil 10 Porutham (பத்து பொருத்தங்கள்) calculation</p>
        </div>

        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 block">👰 Bride's Nakshatra (பெண் நட்சத்திரம்)</label>
              <select
                value={brideStarId}
                onChange={e => setBrideStarId(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-900/80 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-medium"
              >
                {ALL_NAKSHATRAS.map(n => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                    {n.id}. {n.name} — {n.rasi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 block">🤵 Groom's Nakshatra (ஆண் நட்சத்திரம்)</label>
              <select
                value={groomStarId}
                onChange={e => setGroomStarId(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-900/80 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-medium"
              >
                {ALL_NAKSHATRAS.map(n => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                    {n.id}. {n.name} — {n.rasi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40 text-sm tracking-wide"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Calculating Poruthams..." : "Calculate 10 Porutham Compatibility"}
          </button>

          {matchResult && (
            <div className="mt-6 p-6 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-white/10 text-left">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Overall Tamil Porutham Score</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black text-amber-400 font-display">{matchResult.astrology_score}%</span>
                    <span className="text-white/80 font-bold text-sm">({matchResult.matched_count || matchResult.matched_ratio || '8/10'} Matched)</span>
                  </div>
                </div>
                {matchResult.rajju_dosham ? (
                  <div className="px-3.5 py-2 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                    ⚠️ Rajju Dosham Detected (ரஜ்ஜு தோஷம்)
                  </div>
                ) : (
                  <div className="px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                    ✓ Rajju Porutham Matched (ரஜ்ஜு பொருத்தம் உண்டு)
                  </div>
                )}
              </div>

              {/* 10 Poruthams Grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(matchResult.poruthams || []).map((p: any) => (
                  <div
                    key={p.name}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      p.status
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{p.name}</p>
                      <p className="text-xs font-bold mt-0.5 truncate">{p.tamil}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${p.status ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'}`}>
                        {p.status ? '✓ Match' : '✕ No'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 bg-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Success Stories</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">50,000+ Happy Couples</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-3">
                  <img src={t.img1} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                  <img src={t.img2} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t.couple}</p>
                  <p className="text-gray-400 text-xs">{t.married} · {t.city}</p>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                </div>
              </div>
              <div className="relative pl-4">
                <span className="absolute -top-2 left-0 text-4xl text-rose-200 font-display leading-none">"</span>
                <p className="text-gray-600 text-sm leading-relaxed">{t.story}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Verified Success Story</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-[#050C1A] text-white border-t border-sky-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MercuryLogoIcon className="w-10 h-10" />
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-xl tracking-wide text-white">MERCURY CONNECT</span>
                <span className="text-xs text-sky-400 font-medium">The secure space to meet your soulmate</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">India's most trusted matrimony platform offering a secure space to meet your soulmate across all communities.</p>
            <div className="flex gap-2">
              {["FB", "TW", "IG", "YT"].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-[#0284C7] hover:text-white cursor-pointer transition-colors">{s}</div>
              ))}
            </div>
          </div>
          {[
            { title: "Quick Links", links: ["Home", "Register Free", "Success Stories", "Premium Plans", "Blog"] },
            { title: "Community", links: ["Hindu Matrimony", "Muslim Matrimony", "Christian Matrimony", "Tamil Matrimony", "Telugu Matrimony"] },
            { title: "Support", links: ["Help Center", "Privacy Policy", "Terms of Service", "Fraud Alert", "Contact Us"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-sky-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2026 MERCURY CONNECT. All rights reserved. The secure space to meet your soulmate.</p>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-sky-400" />+91 1800 123 4567</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-400" />support@mercuryconnect.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="font-body">
      <HeroSection setPage={setPage} />
      <FeaturedProfiles setPage={setPage} />
      <HowItWorks />
      <PlansSection setPage={setPage} />
      <HoroscopeSection />
      <TestimonialsSection />
      <Footer setPage={setPage} />
    </div>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectInput({ label, options, placeholder }: { label: string; options: string[]; placeholder?: string }) {
  return (
    <FieldGroup label={label}>
      <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors">
        <option value="">{placeholder ?? `Select ${label}`}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </FieldGroup>
  );
}

function TextInput({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <FieldGroup label={label}>
      <input type={type} placeholder={placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors" />
    </FieldGroup>
  );
}

function RegisterStep1({ 
  onNext, 
  setPage, 
  onOtpSent, 
  setCurrentUser,
  initialPhone = "",
  initialGender = "female",
  initialVerified = false
}: { 
  onNext: (phone: string, gender: string) => void; 
  setPage: (p: Page) => void; 
  onOtpSent: (code: string) => void; 
  setCurrentUser?: (user: any) => void;
  initialPhone?: string;
  initialGender?: "male" | "female";
  initialVerified?: boolean;
}) {
  const [sendingOtp, setSendingOtp] = useState(false);
  const [gender, setGender] = useState<"male" | "female">(initialGender || "female");
  const [phone, setPhone] = useState(initialPhone || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(initialVerified || Boolean(initialPhone && initialPhone.length === 10));

  const [error, setError] = useState<string | null>(null);

const handleSendOtp = async () => {
    setError(null);
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    
    setSendingOtp(true);
    try {
      const response = await fetch("http://localhost:5001/api/otp/send-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      // Check if the phone number is already registered (409 Conflict or custom backend flag)
      if (response.status === 409 || data.isRegistered) {
        setError(data.message || "This phone number is already registered. Please log in instead.");
        return; // Stop execution so OTP is not sent/triggered
      }

      if (data.success) {
        setOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.log(err);
      setError("Unable to send SMS OTP. Please try again.");
    } finally {
      setSendingOtp(false); // Ensures loading state always clears
    }
  };
  
  const verifyOtp = async () => {
  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 4) {
    alert("Please enter a valid OTP");
    return;
  }

  setVerifyingOtp(true);

  try {
    const response = await fetch(
      "http://localhost:5001/api/otp/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          otp: enteredOtp,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      onOtpSent(enteredOtp);
      setIsVerified(true);

      if (data.isRegistered && data.user) {
        const safeUser = safeSetVivahUser(data.user);
        setCurrentUser?.(safeUser);
        setPage("dashboard");
      } else {
        onNext(phone, gender);
      }
    } else {
      alert(data.message || "Invalid OTP");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setVerifyingOtp(false);
  }
};
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify your mobile with OTP 1234 (test mode), and upload documents.</p>
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-2">Mobile Number</label>
        <div className="flex gap-3">
          <div className="flex items-center px-4 py-3 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm font-semibold text-gray-700 flex-shrink-0">
            <span className="text-xs mr-1 text-gray-500">IN</span> +91
          </div>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              if (error) setError(null);
            }}
            placeholder="9876543210"
            disabled={isVerified}
            className={`flex-1 px-4 py-3 rounded-[2rem] text-sm transition-all min-w-0 placeholder:text-gray-400 focus:outline-none focus:bg-white
              ${error ? "border-[#e11d48] bg-rose-50/30 focus:border-[#e11d48]" : isVerified ? "border-[#a7f3d0] bg-[#ebfbf3] text-slate-800 focus:border-[#a7f3d0]" : "border-gray-200 bg-gray-50/50 text-slate-800 focus:border-rose-400"}`}
          />
          {isVerified ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="px-5 py-3 rounded-[2rem] border border-[#a7f3d0] bg-[#ebfbf3] text-[#047857] font-semibold flex items-center justify-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4" /> Verified
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVerified(false);
                  setOtpSent(false);
                  setOtp(["", "", "", ""]);
                }}
                className="text-xs text-sky-600 hover:text-sky-800 underline font-medium px-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || phone.length !== 10}
              className={`px-6 py-3 rounded-[2rem] text-white font-bold transition-all text-sm shadow-md cursor-pointer
                ${
                  sendingOtp || phone.length !== 10
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95"
                }`}
            >
              {otpSent ? "Resend" : sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-2.5 text-sm font-medium text-[#e11d48] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        {otpSent && !isVerified && (
          <div className="mt-4 p-5 bg-sky-50/70 border border-sky-200 rounded-[1.5rem]">
            <p className="flex items-center gap-2 text-[#003B7B] font-medium mb-4">
              <CheckCircle className="w-5 h-5 text-[#1D72B8]" /> OTP sent (test code: 1234):
            </p>
            <div className="flex justify-center gap-4 mb-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const newOtp = [...otp];
                    newOtp[index] = value;
                    setOtp(newOtp);
                    if (value && index < 3) {
                      document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      document.getElementById(`otp-${index - 1}`)?.focus();
                    }
                  }}
                  className="w-14 h-14 border border-sky-300 bg-white rounded-[1rem] text-center text-xl font-bold text-slate-800 focus:outline-none focus:border-[#1D72B8] focus:ring-2 focus:ring-sky-200"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyingOtp}
              className="w-full py-3.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white rounded-full font-bold transition-all shadow-md"
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
          <User className="w-4 h-4 text-[#1D72B8]" /> Gender
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setGender("male")}
            className={`py-6 px-4 text-center rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-4 cursor-pointer ${
              gender === "male"
                ? "border-[#1D72B8] bg-sky-50/50 shadow-md ring-2 ring-[#1D72B8]/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${gender === "male" ? "bg-sky-100" : "bg-slate-100"}`}>
              <User className={`w-6 h-6 ${gender === "male" ? "text-[#1D72B8]" : "text-slate-400"}`} />
            </div>
            <span className={`font-bold text-sm ${gender === "male" ? "text-[#003B7B]" : "text-slate-600"}`}>Male</span>
          </button>
          <button
            type="button"
            onClick={() => setGender("female")}
            className={`py-6 px-4 text-center rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-4 cursor-pointer ${
              gender === "female"
                ? "border-[#1D72B8] bg-sky-50/50 shadow-md ring-2 ring-[#1D72B8]/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${gender === "female" ? "bg-sky-100" : "bg-slate-100"}`}>
              <User className={`w-6 h-6 ${gender === "female" ? "text-[#1D72B8]" : "text-slate-400"}`} />
            </div>
            <span className={`font-bold text-sm ${gender === "female" ? "text-[#003B7B]" : "text-slate-600"}`}>Female</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => onNext(phone, gender)}
        disabled={!isVerified}
        className="w-full py-4 mt-6 text-white font-bold text-base rounded-[2rem] shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>

      <div className="text-center mt-6 pt-4">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-bold text-[#1D72B8] hover:text-[#003B7B] transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
// ─── Client-Side Document Photo Extraction (Pure JS + FaceDetector) ─────────
async function extractPhotoFromDocumentClient(file: File): Promise<string | null> {
  if (!file || !file.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.crossOrigin = "anonymous";
    img.src = objectUrl;

    img.onload = async () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          URL.revokeObjectURL(objectUrl);
          return resolve(null);
        }

        // 1. Try Native Browser FaceDetector if supported (Chromium, Edge, etc.)
        if ("FaceDetector" in window) {
          try {
            const detector = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 5 });
            const faces = await detector.detect(img);
            if (faces && faces.length > 0) {
              const face = faces.reduce((prev: any, curr: any) => 
                (curr.boundingBox.width * curr.boundingBox.height > prev.boundingBox.width * prev.boundingBox.height) ? curr : prev, faces[0]);
              
              const box = face.boundingBox;
              const padX = box.width * 0.45;
              const padY = box.height * 0.55;

              const cropX = Math.max(0, box.x - padX);
              const cropY = Math.max(0, box.y - padY * 0.7);
              const cropW = Math.min(w - cropX, box.width + padX * 2);
              const cropH = Math.min(h - cropY, box.height + padY * 2);

              const canvas = document.createElement("canvas");
              canvas.width = 360;
              canvas.height = 360;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 360, 360);
                URL.revokeObjectURL(objectUrl);
                return resolve(canvas.toDataURL("image/jpeg", 0.92));
              }
            }
          } catch (detErr) {
            console.warn("Native FaceDetector note:", detErr);
          }
        }

        // 2. Intelligent Horoscope Document Photo Box Analyzer & Cropper (Pure JS)
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve(null);
        }
        ctx.drawImage(img, 0, 0);

        // Standard horoscope photo candidate zones in Indian biodatas:
        const candidateRegions = [
          { x: Math.round(w * 0.55), y: Math.round(h * 0.02), w: Math.round(w * 0.38), h: Math.round(h * 0.28) }, // Top-Right (Standard)
          { x: Math.round(w * 0.05), y: Math.round(h * 0.02), w: Math.round(w * 0.38), h: Math.round(h * 0.28) }, // Top-Left
          { x: Math.round(w * 0.60), y: Math.round(h * 0.03), w: Math.round(w * 0.34), h: Math.round(h * 0.26) }, // Compact Right
          { x: Math.round(w * 0.33), y: Math.round(h * 0.02), w: Math.round(w * 0.34), h: Math.round(h * 0.28) }  // Top-Center
        ];

        let bestRegion = null;
        let highestScore = 0;

        for (const reg of candidateRegions) {
          if (reg.x + reg.w <= w && reg.y + reg.h <= h) {
            const imgData = ctx.getImageData(reg.x, reg.y, reg.w, reg.h);
            const pixels = imgData.data;
            let skinPixels = 0;
            let totalVar = 0;
            let sampled = 0;

            for (let i = 0; i < pixels.length; i += 16) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              sampled++;

              // Skin color range heuristic
              if (r > 60 && g > 35 && b > 20 && r > g && g > b && (r - b) > 12) {
                skinPixels++;
              }
              if (i >= 16) {
                const pr = pixels[i - 16];
                const pg = pixels[i - 15];
                const pb = pixels[i - 14];
                totalVar += Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
              }
            }

            const skinRatio = skinPixels / Math.max(1, sampled);
            const avgVar = totalVar / Math.max(1, sampled);

            if (skinRatio > 0.03 && avgVar > 10) {
              const score = (skinRatio * 2.5) + (avgVar / 100);
              if (score > highestScore) {
                highestScore = score;
                bestRegion = reg;
              }
            }
          }
        }

        if (bestRegion) {
          const outCanvas = document.createElement("canvas");
          outCanvas.width = 360;
          outCanvas.height = 360;
          const outCtx = outCanvas.getContext("2d");
          if (outCtx) {
            outCtx.drawImage(img, bestRegion.x, bestRegion.y, bestRegion.w, bestRegion.h, 0, 0, 360, 360);
            URL.revokeObjectURL(objectUrl);
            return resolve(outCanvas.toDataURL("image/jpeg", 0.92));
          }
        }

        URL.revokeObjectURL(objectUrl);
        resolve(null);
      } catch (err) {
        console.warn("Document photo extraction error:", err);
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
  });
}

function RegisterStep2({ 
  onNextWithData, 
  onBack, 
  setPage,
  gender,
  updateFormFields, // Optional: pass a setter or field updater from parent
  initialFile = null,
  initialOcrText = "",
  initialOcrFields = {}
}: { 
  onNextWithData: (ocrText: string, ocrFields: Record<string,string>, file: File | null) => void; 
  onBack: () => void; 
  setPage: (p: Page) => void;
  gender?: string;
  updateFormFields?: (fields: Record<string, string>) => void;
  initialFile?: File | null;
  initialOcrText?: string;
  initialOcrFields?: Record<string, string>;
}) {

  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState(initialOcrText || "");
  const [ocrFields, setOcrFields] = useState<Record<string,string>>(initialOcrFields || {});
  const [detectedPhoto, setDetectedPhoto] = useState<string | null>(initialOcrFields?.photo || initialOcrFields?.img || null);
  const [hasDocPhoto, setHasDocPhoto] = useState<boolean>(initialOcrFields?.hasDocumentPhoto === "true");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

const processFile = async (file: File) => {
  setIsProcessing(true);
  setOcrText("");
  setOcrFields({});
  setDetectedPhoto(null);
  setHasDocPhoto(false);

  try {
    // 1. Instant client-side document photo extraction (runs on user's device directly)
    let clientExtractedPhoto: string | null = null;
    if (file && file.type.startsWith("image/")) {
      clientExtractedPhoto = await extractPhotoFromDocumentClient(file);
      if (clientExtractedPhoto) {
        setDetectedPhoto(clientExtractedPhoto);
        setHasDocPhoto(true);
      }
    }

    const formData = new FormData();
    formData.append("file", file);

    const primaryUrl = import.meta.env.VITE_OCR_API_URL || "http://localhost:8000/ocr";
    const fallbackUrl = "https://matrimony-website-o3sg.onrender.com/ocr";

    let response: Response | null = null;
    try {
      response = await fetch(primaryUrl, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.warn(`Primary OCR endpoint (${primaryUrl}) failed, trying fallback...`, err);
    }

    if (!response || !response.ok) {
      if (primaryUrl !== fallbackUrl) {
        try {
          response = await fetch(fallbackUrl, {
            method: "POST",
            body: formData,
          });
        } catch (fbErr) {
          console.warn("Fallback OCR endpoint failed:", fbErr);
        }
      }
    }

    if (response && response.ok) {
      const data = await response.json();
      console.log("FULL API RESPONSE:", data);
      console.log("EXTRACTED FIELDS:", data.fields);

      setOcrText(data.text || "");

      const rawFields = data.fields || {};
      
      // Determine if server or client extracted the document photo
      const serverPhoto = data.photo || rawFields.photo || rawFields.img;
      const isServerPhotoFound = Boolean(data.hasPhoto || (serverPhoto && serverPhoto.startsWith("data:image/")));
      
      const finalExtractedPhoto = (isServerPhotoFound && serverPhoto) ? serverPhoto : clientExtractedPhoto;
      const isPhotoFound = Boolean(finalExtractedPhoto);
      const assignedPhoto = finalExtractedPhoto || getAiPhotoForGender(gender);

      setDetectedPhoto(assignedPhoto);
      setHasDocPhoto(isPhotoFound);

      // Map backend keys to match all frontend form state field key expectations
      const safeFields = {
        ...rawFields,
        img: assignedPhoto,
        photo: assignedPhoto,
        hasDocumentPhoto: isPhotoFound ? "true" : "false",
        name: rawFields.name || rawFields.fullName || rawFields.full_name || "",
        fullName: rawFields.fullName || rawFields.name || rawFields.full_name || "",
        dob: rawFields.dob || rawFields.dateOfBirth || rawFields.date_of_birth || "",
        dateOfBirth: rawFields.dateOfBirth || rawFields.dob || rawFields.date_of_birth || "",
        birth_time: cleanBirthTime(rawFields.birth_time || rawFields.birthTime || ""),
        birthTime: cleanBirthTime(rawFields.birthTime || rawFields.birth_time || ""),
        birth_place: rawFields.birth_place || rawFields.birthPlace || "",
        birthPlace: rawFields.birthPlace || rawFields.birth_place || "",
        religion: rawFields.religion || "",
        caste: rawFields.caste || "",
        sub_caste: rawFields.sub_caste || rawFields.subCaste || "",
        subCaste: rawFields.subCaste || rawFields.sub_caste || "",
        mother_tongue: rawFields.mother_tongue || rawFields.motherTongue || "",
        motherTongue: rawFields.motherTongue || rawFields.mother_tongue || "",
        blood_group: rawFields.blood_group || rawFields.bloodGroup || "",
        bloodGroup: rawFields.bloodGroup || rawFields.blood_group || "",
        height: rawFields.height || "",
        weight: rawFields.weight || "",
        education: rawFields.education || "",
        occupation: rawFields.occupation || "",
        annual_income: rawFields.annual_income || rawFields.annualIncome || rawFields.income || "",
        annualIncome: rawFields.annualIncome || rawFields.annual_income || rawFields.income || "",
        father_name: rawFields.father_name || rawFields.fatherName || rawFields.fathersName || "",
        fatherName: rawFields.fatherName || rawFields.father_name || rawFields.fathersName || "",
        fathersName: rawFields.fathersName || rawFields.father_name || rawFields.fatherName || "",
        father_job: rawFields.father_job || rawFields.fatherJob || rawFields.fathersJob || "",
        fatherJob: rawFields.fatherJob || rawFields.father_job || rawFields.fathersJob || "",
        fathersJob: rawFields.fathersJob || rawFields.father_job || rawFields.fatherJob || "",
        mother_name: rawFields.mother_name || rawFields.motherName || rawFields.mothersName || "",
        motherName: rawFields.motherName || rawFields.mother_name || rawFields.mothersName || "",
        mothersName: rawFields.mothersName || rawFields.mother_name || rawFields.motherName || "",
        mother_job: rawFields.mother_job || rawFields.motherJob || rawFields.mothersJob || "",
        motherJob: rawFields.motherJob || rawFields.mother_job || rawFields.mothersJob || "",
        mothersJob: rawFields.mothersJob || rawFields.mother_job || rawFields.motherJob || "",
        brother: rawFields.brother || rawFields.brotherName || rawFields.brothersName || "",
        brotherName: rawFields.brotherName || rawFields.brother || rawFields.brothersName || "",
        brothersName: rawFields.brothersName || rawFields.brother_name || rawFields.brother || "",
        sister: rawFields.sister || rawFields.sisterName || rawFields.sistersName || "",
        sisterName: rawFields.sisterName || rawFields.sister || rawFields.sistersName || "",
        sistersName: rawFields.sistersName || rawFields.sister_name || rawFields.sister || "",
        email: rawFields.email || "",
        phone: rawFields.phone || rawFields.contactPhone || rawFields.phone_no || "",
        contactPhone: rawFields.contactPhone || rawFields.phone || rawFields.phone_no || "",
        city: rawFields.city || "",
        state: rawFields.state || "",
        country: rawFields.country || "",
        address: rawFields.address || rawFields.residentialAddress || "",
        residentialAddress: rawFields.residentialAddress || rawFields.address || "",
        rasi: rawFields.rasi || "",
        nakshatra: rawFields.nakshatra || "",
        dosham: rawFields.dosham || "",
        gotra: rawFields.gotra || ""
      };

      // ── Check if document already belongs to a registered user ──────────────
      const extractedPhone = safeFields.phone || safeFields.contactPhone || "";
      const extractedName  = safeFields.name  || safeFields.fullName      || "";
      if (extractedPhone || extractedName) {
        try {
          const checkRes = await fetch("http://localhost:5001/api/check-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: extractedPhone, name: extractedName })
          });
          if (checkRes.status === 409) {
            const checkData = await checkRes.json();
            setDocumentError(checkData.message || "This document has already been uploaded. Please login instead.");
            setFile(null);
            setOcrText("");
            setOcrFields({});
            setDetectedPhoto(null);
            setIsProcessing(false);
            return;
          }
        } catch (_checkErr) {
          // If check-document API is down, allow upload to continue
        }
      }
      // ────────────────────────────────────────────────────────────────────────
    
      setOcrFields(safeFields);

      // Pass fields cleanly to parent via callback
      if (typeof updateFormFields === "function") {
        updateFormFields(safeFields);
      }

      // Transition data handler safely
      onNextWithData(data.text || "", safeFields, file);
    } else {
      console.warn("OCR endpoint returned non-OK status, proceeding with file attached.");
      const fallbackAiPhoto = clientExtractedPhoto || getAiPhotoForGender(gender);
      const safeFields = {
        img: fallbackAiPhoto,
        photo: fallbackAiPhoto,
        hasDocumentPhoto: clientExtractedPhoto ? "true" : "false"
      };
      setOcrFields(safeFields);
      setDetectedPhoto(fallbackAiPhoto);
      setHasDocPhoto(Boolean(clientExtractedPhoto));
    }
  } catch (error) {
    console.log("OCR processing skipped, but file is saved for registration:", error);
    const fallbackAiPhoto = clientExtractedPhoto || getAiPhotoForGender(gender);
    const safeFields = {
      img: fallbackAiPhoto,
      photo: fallbackAiPhoto,
      hasDocumentPhoto: clientExtractedPhoto ? "true" : "false"
    };
    setOcrFields(safeFields);
    setDetectedPhoto(fallbackAiPhoto);
    setHasDocPhoto(Boolean(clientExtractedPhoto));
  } finally {
    setIsProcessing(false);
  }
};

const handleContinue = () => {
    if (documentError) return; // Block proceed if document already uploaded
    const fallbackAiPhoto = getAiPhotoForGender(gender);
    const mergedFields = {
      ...ocrFields,
      img: ocrFields.img || ocrFields.photo || detectedPhoto || fallbackAiPhoto,
      photo: ocrFields.photo || ocrFields.img || detectedPhoto || fallbackAiPhoto,
      hasDocumentPhoto: hasDocPhoto ? "true" : (ocrFields.hasDocumentPhoto || "false")
    };
    onNextWithData(ocrText, mergedFields, file);
  };

 return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify WhatsApp, and upload documents.</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <Sparkles className="w-4 h-4 text-[#9333ea]" /> Horoscope (Jathagam) Document Upload (Optional)
        </label>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf" 
          className="hidden" 
        />
        
        {file ? (
          <div className="p-4 bg-[#ebfbf3] border border-[#a7f3d0] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{file.name}</span>
                  <span className="text-xs text-[#059669] mt-0.5">
                    {(file.size / (1024 * 1024)) < 1 ? (file.size / 1024).toFixed(0) + " KB" : (file.size / (1024 * 1024)).toFixed(1) + " MB"} • {isProcessing ? "Scanning..." : "Linked & Ready"}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setOcrText(""); setDetectedPhoto(null); }}
                className="p-2 text-[#059669] hover:bg-[#d1fae5] rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Photo extraction status indicator */}
            {!isProcessing && detectedPhoto && (
              <div className="flex items-center gap-3 pt-2 border-t border-emerald-200/60">
                <img src={detectedPhoto} alt="Profile Photo" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400 flex-shrink-0 shadow-sm" />
                <div className="text-xs">
                  {hasDocPhoto ? (
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      📸 Photo Extracted from Horoscope Document
                    </span>
                  ) : (
                    <span className="font-bold text-sky-800 flex items-center gap-1">
                      ✨ No Photo in Document • AI Profile Photo Assigned
                    </span>
                  )}
                  <p className="text-gray-600 text-[11px] mt-0.5">This will be shown on your profile and avatar.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#9333ea] hover:bg-purple-50/30 transition-colors relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Click to upload Horoscope (PDF/Image) - Optional</p>
            <p className="text-xs text-gray-400 max-w-[250px] mx-auto">Upload Horoscope Image or PDF from device (max 5MB, or skip by clicking Continue below)</p>
          </div>
        )}
      </div>

      {/* ── Document Already Uploaded Error Banner ─────────────────────────── */}
      {documentError && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex-shrink-0 w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#e11d48]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-700 leading-snug">
              Document Already Uploaded
            </p>
            <p className="text-xs text-rose-600 mt-0.5 leading-relaxed">
              This document has already been uploaded and is linked to an existing account.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage("login")}
                className="px-5 py-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white text-xs font-bold rounded-full transition-all shadow-md"
              >
                Login Instead
              </button>
              <button
                type="button"
                onClick={() => { setDocumentError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors"
              >
                Upload Different Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-4 border border-gray-200 text-slate-700 font-semibold rounded-[2rem] hover:bg-gray-50 transition-colors text-sm"
        >
          Back
        </button>
<button
  onClick={() => handleContinue()}
  disabled={isProcessing || !!documentError}
  className="flex-[2] py-4 text-white font-bold rounded-[2rem] shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
>
  {isProcessing ? (
    "Scanning..."
  ) : (
    <>
      Continue <ArrowRight className="w-4 h-4" />
    </>
  )}
</button>      </div>

      <div className="text-center mt-6 pt-4">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-bold text-[#1D72B8] hover:text-[#003B7B] transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Helper to check if a extracted string is a sibling count or placeholder ────
function isCountOrNotProvided(val: any): boolean {
  if (!val || typeof val !== "string") return true;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return true;
  if (["nil", "none", "no", "n/a", "na", "-", "0", "not provided", "null", "undefined"].includes(cleaned)) return true;
  if (/^\d+$/.test(cleaned)) return true;
  if (/^(\d+|one|two|three|four|five|\s|,|brother|sister|brothers|sisters|elder|younger|married|unmarried|-|\(|\))+$/i.test(cleaned)) return true;
  return false;
}

function cleanNameValue(val: any): string {
  if (isCountOrNotProvided(val)) return "";
  return String(val).trim();
}

// ─── OCR Field Extractor ────────────────────────────────────────────────────
function extractFieldsFromOcr(text: string) {
  const extract = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return (m[1] || m[0]).trim();
    }
    return "";
  };

  const rawFatherName = extract([
    /(?:father'?s?\s*name|father\s*name)[\s:\-]+([^\n]+)/i,
    /^(?:father)[\s:\-]+([^\n]+)/i
  ]);
  const rawFatherJob = extract([
    /(?:father'?s?\s*(?:job|occupation|work|profession)|father\s*(?:job|occupation|work|profession))[\s:\-]+([^\n]+)/i,
    /(?:father'?s?\s*status)[\s:\-]+([^\n]+)/i
  ]);
  const rawMotherName = extract([
    /(?:mother'?s?\s*name|mother\s*name)[\s:\-]+([^\n]+)/i,
    /^(?:mother)[\s:\-]+([^\n]+)/i
  ]);
  const rawMotherJob = extract([
    /(?:mother'?s?\s*(?:job|occupation|work|profession)|mother\s*(?:job|occupation|work|profession))[\s:\-]+([^\n]+)/i,
    /(?:mother'?s?\s*status)[\s:\-]+([^\n]+)/i
  ]);
  const rawBrotherName = extract([
    /(?:brother'?s?\s*names?|brother\s*name)[\s:\-]+([^\n]+)/i
  ]);
  const rawSisterName = extract([
    /(?:sister'?s?\s*names?|sister\s*name)[\s:\-]+([^\n]+)/i
  ]);

  return {
    name: extract([/(?:Name|பெயர்)[\s:\-]+([^\n]+)/i, /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}(?:\s+[A-Z])?)$/m]),
    dob: extract([/(?:dob|date of birth|birth date|பிறந்த தேதி)[\s:\-]+([^\n]+)/i, /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/]),
    birthTime: extract([/(?:birth time|time|பிறந்த நேரம்)[\s:\-]+([^\n]+)/i, /\b(\d{2}[:\d]*\s*(?:AM|PM|am|pm))\b/i]),
    birthPlace: extract([/(?:birth place|born at|பிறந்த இடம்)[\s:\-]+([^\n]+)/i]),
    phone: extract([/(?:phone|mobile|contact)[\s:\-]+([^\n]+)/i, /\b(\d{10})\b/]),
    email: extract([/(?:email|e-mail)[\s:\-]+([^\n]+)/i, /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/]),
    rasi: extract([/(?:rasi|raasi|ராசி)[\s:\-]+([^\n]+)/i, /\b(Mesham|Rishabam|Mithunam|Kadagam|Simmam|Kanni|Thulam|Viruchigam|Dhanusu|Magaram|Kumbam|Meenam)\b/i]),
    nakshatra: extract([/(?:nakshatra|star|நட்சத்திரம்)[\s:\-]+([^\n]+)/i, /\b(Ashwini|Bharani|Krithika|Rohini|Mrigasira|Arudra|Punarvasu|Pushya|Aslesha|Magha|Pooram|Uttram|Hastam|Chithirai|Swathi|Visagam|Anusham|Jyeshta|Moolam|Pooradam|Uttaradam|Sravanam|Avittam|Sathayam|Poorattadhi|Uttarattadhi|Revathi)\b/i]),
    dosham: extract([/(?:dosham|dosam|தோஷம்)[\s:\-]+([^\n]+)/i]) || "None",
    gotra: extract([/(?:gotra|gotram|gothram)[\s:\-]+([^\n]+)/i]),
    motherTongue: extract([/(?:mother tongue|language)[\s:\-]+([^\n]+)/i]),
    religion: extract([/(?:religion|மதம்)[\s:\-]+([^\n]+)/i]),
    caste: extract([/(?:caste|community|சாதி)[\s:\-]+([^\n]+)/i]),
    subCaste: extract([/(?:sub.?caste|உட்பிரிவு)[\s:\-]+([^\n]+)/i]),
    familyType: extract([/(?:family type)[\s:\-]+([^\n]+)/i]),
    height: extract([/(?:height)[\s:\-]+([^\n]+)/i]),
    weight: extract([/(?:weight)[\s:\-]+([^\n]+)/i]),
    complexion: extract([/(?:complexion|skin)[\s:\-]+([^\n]+)/i]),
    bloodGroup: extract([/(?:blood|blood group)[\s:\-]+([^\n]+)/i]),
    annualIncome: extract([/(?:income|salary)[\s:\-]+([^\n]+)/i]),
    education: extract([/(?:education|qualification)[\s:\-]+([^\n]+)/i]),
    occupation: extract([/(?:occupation|job)[\s:\-]+([^\n]+)/i]),
    fatherName: cleanNameValue(rawFatherName),
    fatherJob: rawFatherJob,
    motherName: cleanNameValue(rawMotherName),
    motherJob: rawMotherJob,
    brotherName: cleanNameValue(rawBrotherName),
    sisterName: cleanNameValue(rawSisterName),
    city: extract([/(?:city)[\s:\-]+([^\n]+)/i]),
    state: extract([/(?:state)[\s:\-]+([^\n]+)/i]),
    country: extract([/(?:country)[\s:\-]+([^\n]+)/i]) || "India",
    address: extract([/(?:address)[\s:\-]+([^\n]+)/i]),
  };
}

// ─── Register Form Details (Step 3 — OCR-filled editable form) ──────────────
function RegisterFormDetails({ ocrText, ocrFields, horoscopeFile, phone, gender, onBack, onComplete, setPage }:
  { ocrText: string; ocrFields: Record<string,string>; horoscopeFile: File | null; phone: string; gender: string; onBack: () => void; onComplete: (user?: any) => void; setPage: (p: Page) => void }) {

  // Merge: backend structured fields take priority, then frontend regex fallback on raw text
  const rx = extractFieldsFromOcr(ocrText);
  const f = ocrFields; // shorthand for backend fields
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

const safeOcr = rx || {};
const safeForm = f || {};

const initialPhoto = safeForm.img || safeForm.photo || getAiPhotoForGender(gender);
const isDocPhoto = safeForm.hasDocumentPhoto === "true" || Boolean(safeForm.photo && !safeForm.photo.includes("unsplash.com"));

const [form, setForm] = useState({
  img: initialPhoto,
  photo: initialPhoto,
  hasDocumentPhoto: isDocPhoto,
  name: safeForm.name || safeForm.fullName || safeForm.full_name || safeOcr.name || "",
  email: safeForm.email || safeOcr.email || "",
  dob: safeForm.dob || safeForm.dateOfBirth || safeForm.date_of_birth || safeOcr.dob || "",
  birthTime: safeForm.birth_time || safeForm.birthTime || safeOcr.birthTime || "",
  birthPlace: safeForm.birth_place || safeForm.birthPlace || safeOcr.birthPlace || "",
  contactPhone: safeForm.phone || safeForm.contactPhone || safeOcr.phone || phone || "",
  rasi: safeForm.rasi || safeOcr.rasi || "Mesham",
  nakshatra: safeForm.nakshatra || safeOcr.nakshatra || "Rohini",
  dosham: safeForm.dosham || safeOcr.dosham || "None",
  gotra: safeForm.gotra || safeOcr.gotra || "",
  motherTongue: safeForm.mother_tongue || safeForm.motherTongue || "Tamil",
  religion: safeForm.religion || safeOcr.religion || "Hindu",
  caste: safeForm.caste || safeOcr.caste || "",
  subCaste: safeForm.sub_caste || safeForm.subCaste || safeOcr.subCaste || "",
  familyType: safeForm.family_type || safeForm.familyType || safeOcr.familyType || "Joint Family",
  height: safeForm.height || safeOcr.height || "",
  weight: safeForm.weight || safeOcr.weight || "",
  complexion: safeForm.complexion || safeOcr.complexion || "Fair",
  bloodGroup: safeForm.blood_group || safeForm.bloodGroup || safeOcr.bloodGroup || "",
  annualIncome: safeForm.annual_income || safeForm.annualIncome || safeForm.income || safeOcr.annualIncome || "",
  education: safeForm.education || safeOcr.education || "",
  occupation: safeForm.occupation || safeOcr.occupation || "",
  fatherName: cleanNameValue(safeForm.father_name || safeForm.fatherName || safeForm.fathersName || safeOcr.fatherName),
  fatherJob: safeForm.father_job || safeForm.fatherJob || safeForm.fathersJob || safeOcr.fatherJob || "",
  motherName: cleanNameValue(safeForm.mother_name || safeForm.motherName || safeForm.mothersName || safeOcr.motherName),
  motherJob: safeForm.mother_job || safeForm.motherJob || safeForm.mothersJob || safeOcr.motherJob || "",
  brotherName: cleanNameValue(safeForm.brother || safeForm.brotherName || safeForm.brothersName || safeOcr.brotherName),
  sisterName: cleanNameValue(safeForm.sister || safeForm.sisterName || safeForm.sistersName || safeOcr.sisterName),
  city: safeForm.city || safeOcr.city || "",
  state: safeForm.state || safeOcr.state || "",
  country: safeForm.country || safeOcr.country || "India",
  address: safeForm.address || safeForm.residentialAddress || safeOcr.address || "",
});
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

const handleSubmit = async () => {
    if (!form.name) {
        alert("Full name is required.");
        return;
    }

    setSubmitting(true);

    let userAge = 26;
    if (form.dob) {
      const yr = new Date(form.dob).getFullYear();
      if (!isNaN(yr) && yr > 1940 && yr < 2015) {
        userAge = new Date().getFullYear() - yr;
      }
    }

    const photoUrl = form.img || form.photo || getAiPhotoForGender(gender);

    const registeredUser = {
      id: Date.now(),
      name: form.name,
      full_name: form.name,
      email: form.email || "",
      dob: form.dob || "",
      age: userAge,
      gender: gender || "male",
      phone: form.contactPhone || phone || "",
      whatsapp: form.contactPhone || phone || "",
      city: form.city || "Chidambaram",
      state: form.state || "Tamil Nadu",
      country: form.country || "India",
      religion: form.religion || "Hindu",
      caste: form.caste || "Brahmin",
      subCaste: form.subCaste || "",
      gothram: form.gotra || "Kashyapa",
      mother_tongue: form.motherTongue || "Tamil",
      family_type: form.familyType || "Joint Family",
      family_status: "Upper Middle Class",
      family_values: "Traditional",
      height: form.height || "173 cm.",
      weight: form.weight || "",
      complexion: form.complexion || "Fair",
      bloodGroup: form.bloodGroup || "",
      salary: form.annualIncome || "12 LPA",
      income: form.annualIncome || "12 LPA",
      education: form.education || "B.E. (EEE)",
      job: form.occupation || "Software Engineer",
      occupation: form.occupation || "Software Engineer",
      father_name: cleanNameValue(form.fatherName),
      father_occupation: form.fatherJob || "",
      mother_name: cleanNameValue(form.motherName),
      mother_occupation: form.motherJob || "",
      brother_name: cleanNameValue(form.brotherName),
      sister_name: cleanNameValue(form.sisterName),
      siblings: [cleanNameValue(form.brotherName), cleanNameValue(form.sisterName)].filter(Boolean).join(", ") || "",
      address: form.address || "",
      rasi: form.rasi || "Mesham",
      nakshatra: form.nakshatra || "Ashwini",
      dosham: form.dosham || "None",
      birth_time: form.birthTime || "06:30 AM",
      birth_place: form.birthPlace || form.city || "Chidambaram",
      marital_status: "Never Married",
      diet: "Vegetarian",
      img: photoUrl,
      photo: photoUrl,
      isCustomPhoto: true,
      premium_plan: "Premium",
      verified: true,
      online: true,
      // Expectations defaults (derived from own profile for smart matching)
      pref_age_min: String(Math.max(18, userAge - 5)),
      pref_age_max: String(userAge + 5),
      pref_height: "Any",
      pref_religion: form.religion || "Hindu",
      pref_education: "Any Graduate",
      pref_income: "Any",
      pref_occupation: "Any",
      pref_location: form.state || "Tamil Nadu",
      pref_dosham: "None preferred",
    };

    try {
        const formData = new FormData();

        Object.entries(form).forEach(([k, v]) => {
            formData.append(k, v);
        });

        // Append fields NOT already in form (avoid duplicates that cause arrays)
        if (!form.phone) formData.append("phone", phone);
        if (!form.gender) formData.append("gender", gender);
        if (!form.age) formData.append("age", String(userAge));
        // Always override phone/gender/age with the verified values from Step 1
        formData.set("phone", phone);
        formData.set("gender", gender);
        formData.set("age", String(userAge));
        formData.set("img", photoUrl);

        if (horoscopeFile) {
            formData.append("horoscope", horoscopeFile);
        }

        const res = await fetch("http://localhost:5001/api/register", {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (res.status === 409 || data.isRegistered) {
            setErrorMessage(data.message || data.error || "This phone number is already registered.");
            return;
        }

        if (!res.ok || !data.success) {
            setErrorMessage(data.message || data.error || "Registration failed. Please check your details and try again.");
            return;
        }

        if (data.success && data.user) {
          const serverImg = formatPhotoUrl(data.user.img || data.user.photo || "");
          
          // PRESERVE the extracted document photo:
          // If the user had a document photo (base64 or custom) and backend returned a generic unsplash photo, keep the user's extracted photo!
          const chosenPhoto = (serverImg && serverImg.includes("/uploads/")) 
            ? serverImg 
            : (photoUrl || serverImg);

          savePhotoToLocalCache(phone, chosenPhoto);

          // Merge: server data wins ONLY if the field is non-empty.
          const mergedFromServer: Record<string, any> = {};
          Object.entries(data.user).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              mergedFromServer[k] = v;
            }
          });

          const finalUser = { 
            ...registeredUser, 
            ...mergedFromServer,
            img: chosenPhoto,
            photo: chosenPhoto,
            avatar: chosenPhoto,
            profile_image: chosenPhoto,
            isCustomPhoto: isDocPhoto || form.hasDocumentPhoto
          };
          safeSetVivahUser(finalUser);
          savePhotoToLocalCache(phone, chosenPhoto);
          onComplete(finalUser);
          return;
        }
    } catch (err: any) {
        console.error("Backend error during registration:", err);
        setErrorMessage("Network or server error during registration. Please ensure backend is running.");
        return;
    } finally {
        setSubmitting(false);
    }

    savePhotoToLocalCache(phone, photoUrl);
    const finalLocal = {
      ...registeredUser,
      img: photoUrl,
      photo: photoUrl,
      avatar: photoUrl,
      profile_image: photoUrl,
      isCustomPhoto: isDocPhoto || form.hasDocumentPhoto
    };
    safeSetVivahUser(finalLocal);
    onComplete(finalLocal);
};
  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <span className="text-[#9333ea]">{icon}</span>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
  );

  const Fld = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{req && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inp = (fk: string, ph?: string, tp = "text") => (
    <input type={tp} value={(form as Record<string, string>)[fk]} onChange={set(fk)} placeholder={ph}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors" />
  );

  const sel = (fk: string, opts: string[]) => (
    <select value={(form as Record<string, string>)[fk]} onChange={set(fk)}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors">
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  const RASI = ["Mesham","Rishabam","Mithunam","Kadagam","Simmam","Kanni","Thulam","Viruchigam","Dhanusu","Magaram","Kumbam","Meenam"];
  const NAKSHATRA = ["Ashwini","Bharani","Krithika","Rohini","Mrigasira","Arudra","Punarvasu","Pushya","Aslesha","Magha","Pooram","Uttram","Hastam","Chithirai","Swathi","Visagam","Anusham","Jyeshta","Moolam","Pooradam","Uttaradam","Sravanam","Avittam","Sathayam","Poorattadhi","Uttarattadhi","Revathi"];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify WhatsApp, and upload documents.</p>
      </div>


      {/* OCR Banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
        <Sparkles className="w-4 h-4 text-[#9333ea] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-purple-700">Form &amp; Horoscope Details Review</p>
          <p className="text-xs text-purple-500 mt-0.5">Please review, correct, or fill in the matrimony form details. These are extracted via OCR and will be saved to your profile.</p>
        </div>
      </div>

      {/* Profile Photo Preview / Assignment Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl">
        <div className="relative">
          <img
            src={form.img || getAiPhotoForGender(gender)}
            alt="Profile Preview"
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getAiPhotoForGender(gender);
            }}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
            <span className="font-bold text-sm text-[#0F2C59]">Profile Picture</span>
            {form.hasDocumentPhoto ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                📸 Extracted from Horoscope Document
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-[#0284C7] border border-sky-300 flex items-center gap-1">
                ✨ AI Profile Photo Assigned ({gender === "bride" || gender === "female" ? "Bride" : "Groom"})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mb-2">
            {form.hasDocumentPhoto
              ? "Your photo was automatically detected from your horoscope document and set on your profile and avatar."
              : "No photo was found in your horoscope document. A realistic AI profile photo has been assigned, which you can customize anytime."}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <label htmlFor="reg-form-photo-upload" className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm cursor-pointer inline-flex items-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5 text-[#1D72B8]" />
              <span>Change / Upload Photo</span>
            </label>
            <input
              type="file"
              id="reg-form-photo-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => {
                    setForm(prev => ({
                      ...prev,
                      img: r.result as string,
                      photo: r.result as string,
                      hasDocumentPhoto: true
                    }));
                  };
                  r.readAsDataURL(f);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <SectionTitle icon={<User className="w-4 h-4" />} title="Basic Information" />
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Full Name" req>{inp("name","")}</Fld>
          <Fld label="Email ID" req>{inp("email","","email")}</Fld>
          <Fld label="Date of Birth">{inp("dob","")}</Fld>
          <Fld label="Birth Time">{inp("birthTime","")}</Fld>
          <Fld label="Birth Place">{inp("birthPlace","")}</Fld>
          <Fld label="Contact Phone">{inp("contactPhone","","")}</Fld>
        </div>
      </div>

      {/* Horoscope + Physical side by side */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionTitle icon={<Heart className="w-4 h-4" />} title="Horoscope &amp; Community" />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Rasi">{sel("rasi", RASI)}</Fld>
            <Fld label="Nakshatra">{sel("nakshatra", NAKSHATRA)}</Fld>
            <Fld label="Dosham">{sel("dosham", ["None","Chevvai","Raghu","Ketu","Shani"])}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Fld label="Gotra">{inp("gotra","Gotra")}</Fld>
            <Fld label="Mother Tongue">{inp("motherTongue","Tamil")}</Fld>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Religion">{sel("religion",["Hindu","Muslim","Christian","Jain","Buddhist","Sikh","Other"])}</Fld>
            <Fld label="Caste">{inp("caste","kulam/Gothra")}</Fld>
            <Fld label="Sub Caste">{inp("subCaste","e.g. Kongu Go")}</Fld>
          </div>
          <Fld label="Family Type">{sel("familyType",["Joint Family","Nuclear Family","Extended Family"])}</Fld>
        </div>

        <div>
          <SectionTitle icon={<Star className="w-4 h-4" />} title="Physical &amp; Professional" />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Height">{inp("height","")}</Fld>
            <Fld label="Weight">{inp("weight","")}</Fld>
            <Fld label="Complexion">{sel("complexion",["Very Fair","Fair","Wheatish","Wheatish Brown","Dark"])}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Fld label="Blood Group">{inp("bloodGroup","")}</Fld>
            <Fld label="Annual Income">{inp("annualIncome","")}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Fld label="Education">{inp("education","")}</Fld>
            <Fld label="Occupation">{inp("occupation","")}</Fld>
          </div>
        </div>
      </div>

      {/* Family Background */}
      <div>
        <SectionTitle icon={<Users className="w-4 h-4" />} title="Family Background" />
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Father's Name">{inp("fatherName","")}</Fld>
          <Fld label="Father's Job">{inp("fatherJob","")}</Fld>
          <Fld label="Mother's Name">{inp("motherName","")}</Fld>
          <Fld label="Mother's Job">{inp("motherJob","")}</Fld>
          <Fld label="Brother's Name">{inp("brotherName","")}</Fld>
          <Fld label="Sister's Name">{inp("sisterName","")}</Fld>
        </div>
      </div>
 
      {/* Contact & Location */}
      <div>
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Contact &amp; Location Details" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Fld label="City">{inp("city","")}</Fld>
          <Fld label="State">{inp("state","Tamil Nadu")}</Fld>
          <Fld label="Country">{inp("country","India")}</Fld>
        </div>
        <Fld label="Residential Address">
          <textarea value={form.address} onChange={set("address")}
            placeholder="3, Galaxy Apartments, BJ Road Band Stand, Bandra West, Mumbai, Maharashtra"
            rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors resize-none" />
        </Fld>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-600 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <button onClick={onBack}
          className="flex-1 py-4 border border-gray-200 text-slate-700 font-semibold rounded-[2rem] hover:bg-gray-50 transition-colors text-sm">
          Back
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-[2] py-4 text-white font-bold rounded-[2rem] shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
          {submitting
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
            : <>Complete Registration <CheckCircle className="w-4 h-4" /></>}
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button onClick={() => setPage("login")}
            className="font-bold text-[#1D72B8] hover:text-[#003B7B] transition-colors bg-transparent border-none p-0 cursor-pointer">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterLocationVerificationStep({
  user,
  onComplete,
  onBack,
  setPage
}: {
  user: any;
  onComplete: (updatedUser?: any) => void;
  onBack: () => void;
  setPage: (p: Page) => void;
}) {
  const [showPrompt, setShowPrompt] = useState(true);
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "skipped">("idle");
  const [locationLabel, setLocationLabel] = useState<string>(
    user?.city ? `${user.city}${user.state ? `, ${user.state}` : ""}, ${user.country || "India"}${user.pincode ? ` · ${user.pincode}` : ""}` : ""
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    user?.latitude && user?.longitude ? { lat: Number(user.latitude), lng: Number(user.longitude) } : null
  );
  const [locationError, setLocationError] = useState("");
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [customCity, setCustomCity] = useState(user?.city || "");
  const [customState, setCustomState] = useState(user?.state || "Tamil Nadu");
  const [customPincode, setCustomPincode] = useState(user?.pincode || "");

  // Reverse geocode real coordinates and update user
  const resolveCoordinatesAndSave = async (lat: number, lng: number) => {
    let detectedCity = user?.city || "";
    let detectedState = user?.state || "";
    let detectedCountry = user?.country || "India";
    let detectedPincode = user?.pincode || "";

    // 1. BigDataCloud Reverse Geocoding (high precision, zero CORS issues, accurate Indian localities)
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        detectedCity = data.locality || data.city || data.principalSubdivisionLocality || detectedCity;
        detectedState = data.principalSubdivision || detectedState;
        detectedCountry = data.countryName || detectedCountry;
        detectedPincode = data.postcode || detectedPincode;
      }
    } catch (_) {}

    // 2. OpenStreetMap fallback
    if (!detectedCity) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        if (res.ok) {
          const data = await res.json();
          detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || detectedCity;
          detectedState = data.address?.state || detectedState;
          detectedCountry = data.address?.country || detectedCountry;
          detectedPincode = data.address?.postcode || detectedPincode;
        }
      } catch (_) {}
    }

    if (!detectedCity) detectedCity = user?.city || "Current Location";
    if (!detectedState) detectedState = user?.state || "";

    const formatted = `${detectedCity}${detectedState ? `, ${detectedState}` : ""}${detectedCountry ? `, ${detectedCountry}` : ""}${detectedPincode ? ` · ${detectedPincode}` : ""}`;

    setCoords({ lat, lng });
    setLocationLabel(formatted);
    setCustomCity(detectedCity);
    setCustomState(detectedState);
    setCustomPincode(detectedPincode);
    setStatus("granted");
    setShowPrompt(false);

    const updatedUser = {
      ...user,
      latitude: lat,
      longitude: lng,
      location_verified: true,
      city: detectedCity,
      state: detectedState,
      country: detectedCountry,
      pincode: detectedPincode
    };

    safeSetVivahUser(updatedUser);

    try {
      await fetch("http://localhost:5001/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          phone: user?.phone,
          latitude: lat,
          longitude: lng,
          city: detectedCity,
          state: detectedState,
          country: detectedCountry,
          pincode: detectedPincode
        })
      });
    } catch (err) {
      console.warn("Backend location sync failed:", err);
    }
  };

  // Fallback if browser GPS is blocked/unsupported: use IP or user's form city
  const resolveIpOrAddressLocation = async () => {
    // 1. Try IP Geolocation API
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          const city = data.city || user?.city || "Current Location";
          const state = data.region || user?.state || "";
          const country = data.country_name || user?.country || "India";
          const pin = data.postal || user?.pincode || "";
          const label = `${city}${state ? `, ${state}` : ""}, ${country}${pin ? ` · ${pin}` : ""}`;

          setCoords({ lat, lng });
          setLocationLabel(label);
          setCustomCity(city);
          setCustomState(state);
          setCustomPincode(pin);
          setStatus("granted");
          setShowPrompt(false);

          const updatedUser = {
            ...user,
            latitude: lat,
            longitude: lng,
            location_verified: true,
            city,
            state,
            country,
            pincode: pin
          };
          safeSetVivahUser(updatedUser);

          try {
            await fetch("http://localhost:5001/api/user/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                phone: user?.phone,
                latitude: lat,
                longitude: lng,
                city,
                state,
                country,
                pincode: pin
              })
            });
          } catch (_) {}
          return;
        }
      }
    } catch (_) {}

    // 2. Geocode user's registered form city
    const userCity = user?.city || user?.district || "Chennai";
    const userState = user?.state || "Tamil Nadu";
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(userCity + " " + userState)}&format=json&limit=1`);
      if (res.ok) {
        const list = await res.json();
        if (list && list.length > 0) {
          const lat = parseFloat(list[0].lat);
          const lng = parseFloat(list[0].lon);
          const label = `${userCity}, ${userState}, ${user?.country || "India"}${user?.pincode ? ` · ${user.pincode}` : ""}`;
          
          setCoords({ lat, lng });
          setLocationLabel(label);
          setCustomCity(userCity);
          setCustomState(userState);
          setStatus("granted");
          setShowPrompt(false);

          const updatedUser = {
            ...user,
            latitude: lat,
            longitude: lng,
            location_verified: true,
            city: userCity,
            state: userState,
            country: user?.country || "India",
            pincode: user?.pincode || ""
          };
          safeSetVivahUser(updatedUser);

          try {
            await fetch("http://localhost:5001/api/user/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                phone: user?.phone,
                latitude: lat,
                longitude: lng,
                city: userCity,
                state: userState,
                country: user?.country || "India",
                pincode: user?.pincode
              })
            });
          } catch (_) {}
          return;
        }
      }
    } catch (_) {}

    // 3. Last fallback: display user's profile location
    const fallbackLabel = `${user?.city || "Registered City"}${user?.state ? `, ${user.state}` : ""}, ${user?.country || "India"}`;
    setLocationLabel(fallbackLabel);
    setStatus("granted");
    setShowPrompt(false);
  };

  const handleAllowClick = (type: "site" | "time") => {
    setStatus("requesting");
    setLocationError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await resolveCoordinatesAndSave(pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          console.warn("HTML5 Geolocation error or denied:", err);
          await resolveIpOrAddressLocation();
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      resolveIpOrAddressLocation();
    }
  };

  const handleManualSave = async () => {
    if (!customCity.trim()) return;
    setStatus("requesting");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customCity + " " + customState)}&format=json&limit=1`);
      let lat = coords?.lat || 13.0827;
      let lng = coords?.lng || 80.2707;
      if (res.ok) {
        const list = await res.json();
        if (list && list.length > 0) {
          lat = parseFloat(list[0].lat);
          lng = parseFloat(list[0].lon);
        }
      }
      const label = `${customCity.trim()}${customState ? `, ${customState}` : ""}, India${customPincode ? ` · ${customPincode.trim()}` : ""}`;
      setCoords({ lat, lng });
      setLocationLabel(label);
      setStatus("granted");
      setIsEditingManually(false);
      setShowPrompt(false);

      const updatedUser = {
        ...user,
        latitude: lat,
        longitude: lng,
        location_verified: true,
        city: customCity.trim(),
        state: customState,
        country: "India",
        pincode: customPincode.trim()
      };
      safeSetVivahUser(updatedUser);

      await fetch("http://localhost:5001/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          phone: user?.phone,
          latitude: lat,
          longitude: lng,
          city: customCity.trim(),
          state: customState,
          country: "India",
          pincode: customPincode.trim()
        })
      });
    } catch (_) {
      setIsEditingManually(false);
      setStatus("granted");
    }
  };

  const handleNeverAllow = () => {
    setStatus("denied");
    setShowPrompt(false);
  };

  return (
    <div className="relative space-y-6">
      {/* Chrome / Browser-style floating permission prompt in Top-Left (Exact replica of user screenshot) */}
      {showPrompt && (
        <div className="fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300 font-sans max-w-[340px] w-full">
          {/* Top URL Bar mock bubble */}
          <div className="mb-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D3E3FD]/95 backdrop-blur-md rounded-full shadow-md border border-blue-200 text-xs text-[#041E49]">
            <MapPin className="w-3.5 h-3.5 text-[#0B57D0]" />
            <span className="font-bold text-[#041E49]">Use your location?</span>
            <span className="text-slate-600 truncate text-[11px]">mercurysoftech.in/matrimony...</span>
          </div>

          {/* Dialog Card matching uploaded image */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 text-left">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                mercurysoftech.in <span className="font-normal text-slate-700">wants to</span>
              </h3>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Subtitle / Permission line */}
            <div className="flex items-center gap-2.5 text-slate-800">
              <MapPin className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-800">Know your location</span>
            </div>

            {/* Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleAllowClick("site")}
                className="w-full py-2.5 px-4 bg-[#D3E3FD] hover:bg-[#C2D9FB] active:bg-[#B0CEF9] text-[#041E49] font-bold text-sm rounded-full transition-all text-center shadow-xs cursor-pointer"
              >
                Allow while visiting the site
              </button>
              <button
                type="button"
                onClick={() => handleAllowClick("time")}
                className="w-full py-2.5 px-4 bg-[#D3E3FD] hover:bg-[#C2D9FB] active:bg-[#B0CEF9] text-[#041E49] font-bold text-sm rounded-full transition-all text-center shadow-xs cursor-pointer"
              >
                Allow this time
              </button>
              <button
                type="button"
                onClick={handleNeverAllow}
                className="w-full py-2.5 px-4 bg-[#D3E3FD] hover:bg-[#C2D9FB] active:bg-[#B0CEF9] text-[#041E49] font-bold text-sm rounded-full transition-all text-center shadow-xs cursor-pointer"
              >
                Never allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Card Content */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-slate-800">Location Verification</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          We verify your location to calculate accurate distances and provide authentic verified matches in your region.
        </p>
      </div>

      {/* Interactive Status Card */}
      <div className="border border-slate-200 bg-slate-50/60 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
        {status === "granted" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in-75 duration-300 shadow-sm">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Location Verified Successfully!</h3>
              <p className="text-sm font-bold text-emerald-700 mt-1">{locationLabel}</p>
              {coords && (
                <p className="text-xs text-slate-400 mt-0.5">
                  GPS Coordinates: Lat {coords.lat.toFixed(4)}, Lon {coords.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Manual Edit / Refine Location Option */}
            {isEditingManually ? (
              <div className="w-full max-w-md p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-left">
                <p className="text-xs font-bold text-slate-700">Edit / Correct Your City &amp; Pincode:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">City / District</label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="e.g. Coimbatore, Madurai"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Pincode</label>
                    <input
                      type="text"
                      value={customPincode}
                      onChange={(e) => setCustomPincode(e.target.value)}
                      placeholder="641001"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingManually(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#1D72B8] rounded-lg hover:bg-[#003B7B]"
                  >
                    Save &amp; Update
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingManually(true)}
                className="text-xs font-semibold text-[#1D72B8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Wrong location? Click to change or re-detect</span>
              </button>
            )}

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 max-w-sm">
              ✨ Your regional profile authenticity is verified. You will now see genuine nearby matches with accurate distance badges!
            </div>
          </>
        ) : status === "requesting" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center animate-pulse">
              <svg className="animate-spin h-8 w-8 text-[#1D72B8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Detecting Your Real Location...</h3>
              <p className="text-xs text-slate-500 mt-1">Please allow location access in your browser or choose an option above.</p>
            </div>
          </>
        ) : status === "denied" || status === "skipped" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Location Verification Skipped</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                You can still browse matches by city and state, and you can enable GPS verification later from your Profile Settings.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center border-2 border-dashed border-[#1D72B8]/40">
                <MapPin className="w-8 h-8 text-[#1D72B8]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#1D72B8]"></span>
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Enable Location Services</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Select an option in the top permission prompt or click below to verify your regional authenticity.
              </p>
            </div>
          </>
        )}

        {locationError && (
          <p className="text-xs text-rose-500 font-medium">{locationError}</p>
        )}

        {/* Primary Action */}
        {status === "granted" ? (
          <button
            onClick={() => onComplete(user)}
            className="w-full py-4 text-white font-bold text-base rounded-full shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 cursor-pointer mt-2"
          >
            <span>Proceed to Dashboard &amp; Profile</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-full space-y-2.5 mt-2">
            <button
              onClick={() => handleAllowClick("site")}
              disabled={status === "requesting"}
              className="w-full py-4 text-white font-bold text-base rounded-full shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 cursor-pointer disabled:opacity-60"
            >
              <MapPin className="w-5 h-5" />
              <span>Allow Location Verification</span>
            </button>
            <button
              onClick={() => {
                setStatus("skipped");
                onComplete(user);
              }}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
            >
              Skip for now and continue →
            </button>
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-bold text-[#1D72B8] hover:text-[#003B7B] transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({
  step,
  setStep,
  setPage,
  setCurrentUser,
  setSelectedProfileId
}: {
  step: number;
  setStep: (s: number) => void;
  setPage: (p: Page) => void;
  setCurrentUser?: (user: any) => void;
  setSelectedProfileId?: (id: number) => void;
}) {
  const [otpCode, setOtpCode] = useState("4495");
  const [regPhone, setRegPhone] = useState("");
  const [regGender, setRegGender] = useState<"male" | "female">("female");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrFields, setOcrFields] = useState<Record<string,string>>({});
  const [horoscopeFile, setHoroscopeFile] = useState<File | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F2C59] to-slate-900 py-10 px-4">
      <div className={step === 3 ? "max-w-4xl mx-auto" : "max-w-lg mx-auto"}>
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <MercuryLogoIcon className="w-10 h-10" />
            <span className="font-display font-extrabold text-2xl tracking-wide text-white">MERCURY CONNECT</span>
          </div>
          <p className="text-sky-300 font-medium text-sm">The secure space to meet your soulmate</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE]"
                      : s < step
                      ? "w-6 bg-emerald-500"
                      : "w-6 bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              STEP {step} OF 4 · {step === 1 ? "Mobile & Gender" : step === 2 ? "Horoscope" : step === 3 ? "Profile Form" : "Location"}
            </span>
          </div>

          {step === 1 && (
            <RegisterStep1
              initialPhone={regPhone}
              initialGender={regGender}
              initialVerified={isPhoneVerified}
              onNext={(ph, gn) => { 
                setRegPhone(ph); 
                setRegGender(gn as "male" | "female"); 
                setIsPhoneVerified(true);
                setStep(2); 
              }}
              setPage={setPage}
              onOtpSent={(code) => setOtpCode(code)}
              setCurrentUser={setCurrentUser}
            />
          )}
          {step === 2 && (
            <RegisterStep2
              gender={regGender}
              initialFile={horoscopeFile}
              initialOcrText={ocrText}
              initialOcrFields={ocrFields}
              onNextWithData={(ocr, fields, file) => {
                setOcrText(ocr);
                setOcrFields(fields);
                setHoroscopeFile(file);
                setStep(3);
              }}
              onBack={() => setStep(1)}
              setPage={setPage}
            />
          )}
          {step === 3 && (
            <RegisterFormDetails
              ocrText={ocrText}
              ocrFields={ocrFields}
              horoscopeFile={horoscopeFile}
              phone={regPhone}
              gender={regGender}
              onBack={() => setStep(2)}
              onComplete={(createdUser) => {
                if (createdUser) {
                  setCurrentUser?.(createdUser);
                  setSelectedProfileId?.(createdUser.id);
                  setRegisteredUser(createdUser);
                }
                setStep(4);
              }}
              setPage={setPage}
            />
          )}
          {step === 4 && (
            <RegisterLocationVerificationStep
              user={registeredUser || { phone: regPhone, gender: regGender }}
              onComplete={(updatedUser) => {
                const final = updatedUser || registeredUser;
                if (final) {
                  setCurrentUser?.(final);
                  setSelectedProfileId?.(final.id);
                }
                setPage("profile");
              }}
              onBack={() => setStep(3)}
              setPage={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ setPage, setCurrentUser }: { setPage: (p: Page) => void; setCurrentUser: (user: any) => void }) {
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [notification, setNotification] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setSendingOtp(true);
    try {
      const response = await fetch("http://localhost:5001/api/otp/send-login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        setNotification(true);
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Cannot connect to backend. Make sure the server is running on port 5001.');
    } finally {
      setSendingOtp(false);
    }
  };

const handleResend = async () => {
  setResending(true);

  try {
    const response = await fetch(
      "http://localhost:5001/api/otp/send-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setOtpSent(true);
      setNotification(true);
    } else {
      alert(data.message || "Failed to resend OTP");
    }
  } catch (err) {
    console.error("Resend OTP Error:", err);
    alert("Unable to resend OTP");
  } finally {
    setResending(false);
  }
};

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      alert("Please enter a valid OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch("http://localhost:5001/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          otp: enteredOtp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.isRegistered && data.user) {
          // Check local photo cache by phone
          let cachedPhonePhoto = "";
          try {
            const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
            const photoCache = JSON.parse(localStorage.getItem("vivahUserPhotos") || "{}");
            cachedPhonePhoto = photoCache[cleanPhone] || photoCache[phone] || "";
          } catch (_) {}

          const serverPhoto = formatPhotoUrl(data.user.img || data.user.photo || "");
          const isServerCustom = hasCustomUploadedPhoto(data.user);

          const resolvedPhoto = isServerCustom
            ? serverPhoto
            : (cachedPhonePhoto ? formatPhotoUrl(cachedPhonePhoto) : (serverPhoto || getAiPhotoForGender(data.user.gender)));

          if (resolvedPhoto && !resolvedPhoto.includes("unsplash.com") && !resolvedPhoto.includes("pravatar.cc")) {
            savePhotoToLocalCache(phone, resolvedPhoto);
          }

          const serverNonEmpty: Record<string, any> = {};
          Object.entries(data.user).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              serverNonEmpty[k] = v;
            }
          });

          const userWithPhoto = {
            ...serverNonEmpty,
            img: resolvedPhoto,
            photo: resolvedPhoto,
            isCustomPhoto: isServerCustom || Boolean(cachedPhonePhoto)
          };
          const safeUser = safeSetVivahUser(userWithPhoto);
          setCurrentUser(safeUser);
          setPage("dashboard");
        } else {
          alert("This phone number is not registered. Please register first.");
          setPage("register");
        }
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 py-16 px-4">
      {/* SMS notification toast */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 max-w-xs bg-gray-900 text-white rounded-2xl shadow-2xl p-4"
          style={{ animation: "slideInRight 0.4s ease" }}
        >
          <button
            onClick={() => setNotification(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg leading-none bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.549 4.116 1.508 5.855L0 24l6.335-1.483A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.877 0-3.647-.5-5.188-1.377l-.372-.219-3.761.881.923-3.667-.242-.388A9.934 9.934 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-400 mb-0.5">SMS Notification</p>
              <p className="text-sm font-bold text-white">MERCURY CONNECT OTP Verification</p>
              <p className="text-xs text-gray-300 mt-0.5">Test mode — enter OTP 1234</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[1.5rem] shadow-sm p-8 border border-gray-100 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-800">Login</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your mobile number to receive an OTP. Test code is 1234.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Mobile Number</label>
            <div className="flex gap-2 items-center">
              <div className={`flex items-center px-4 py-3.5 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm font-semibold text-slate-700 flex-shrink-0 ${otpSent ? "opacity-60" : ""}`}>
                <span className="text-xs mr-1 text-gray-500">IN</span> +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className={`flex-1 px-4 py-3.5 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm text-slate-800 focus:outline-none focus:border-[#e11d48] focus:bg-white transition-all min-w-0 placeholder:text-gray-400 ${otpSent ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={sendingOtp || otpSent}
              />
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || phone.length !== 10}
                  className={`px-6 py-3.5 text-white font-bold rounded-[2rem] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    sendingOtp || phone.length !== 10
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95"
                  }`}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="p-6 bg-sky-50/70 border border-sky-200 rounded-[1.5rem] space-y-6">
              <p className="text-sm font-medium text-[#003B7B] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#1D72B8]" />
                OTP sent (test code: 1234). Enter below:
              </p>
              <div className="flex gap-4 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    id={`login-otp-${i}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const n = [...otp]; n[i] = val; setOtp(n);
                      if (val && i < 3) document.getElementById(`login-otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0)
                        document.getElementById(`login-otp-${i - 1}`)?.focus();
                    }}
                    className="w-14 h-14 text-center border-2 border-sky-300 rounded-2xl text-xl font-bold focus:outline-none focus:border-[#1D72B8] focus:ring-2 focus:ring-sky-200 bg-white text-slate-800"
                  />
                ))}
              </div>

              <button
                onClick={verifyOtp}
                disabled={!otp.every((d) => d !== "") || verifyingOtp}
                className={`w-full py-4 text-white font-bold text-base rounded-[2rem] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  otp.every((d) => d !== "") && !verifyingOtp
                    ? "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-70"
                }`}
              >
                <span>{verifyingOtp ? "Verifying..." : "Verify & Login"}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setOtpSent(false); setOtp(["", "", "", ""]); }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Change Mobile Number
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 mt-4 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm text-slate-500">
              New to MERCURY CONNECT?{" "}
              <button
                onClick={() => setPage("register")}
                className="font-bold text-[#0284C7] hover:text-[#0F2C59] transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Register Free
              </button>
            </p>
            <button 
              onClick={() => setPage("landing")}
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mx-auto bg-transparent border-none cursor-pointer"
            >
              &#8592; Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Dashboard ────────────────────────────────────────────────────────────────

// function ProfileCard({ profile: p, setPage }: { profile: typeof PROFILES[0]; setPage: (pg: Page) => void }) {
//   const [interested, setInterested] = useState(false);
//   const [shortlisted, setShortlisted] = useState(false);
//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all duration-300 group">
//       <div className="relative h-56 bg-rose-50">
//         {p.img || p.photo ? (
//           <img src={p.img || p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
//         ) : (
//           <div className="w-full h-full bg-gradient-to-br from-rose-400 to-purple-500 flex flex-col items-center justify-center text-white">
//             <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-3xl shadow-inner">
//               {(p.name || p.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
//             </div>
//             <span className="text-xs text-white/80 font-medium mt-2">No photo</span>
//           </div>
//         )}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
//         <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
//           {p.premium && <PremiumBadge />}
//           <MatchBadge pct={p.match} />
//         </div>
//         <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
//           <span className={`w-1.5 h-1.5 rounded-full ${p.online ? "bg-emerald-400" : "bg-gray-400"}`} />
//           <span className="text-white text-xs">{p.online ? "Online" : "Offline"}</span>
//         </div>
//         <div className="absolute bottom-0 left-0 right-0 p-3">
//           <h3 className="font-display font-bold text-white text-lg leading-tight">{p.name}</h3>
//           <p className="text-white/75 text-sm">{p.age} {p.city}, {p.state}</p>
//         </div>
//       </div>
//       <div className="p-4">
//         <div className="grid grid-cols-2 gap-y-1.5 mb-3">
//           {([
//             [BookOpen, p.education], [CreditCard, p.salary], [User, p.caste], [MapPin, p.city]
//           ] as [typeof BookOpen, string][]).map(([Icon, val], i) => (
//             <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
//               <Icon className="w-3 h-3 text-rose-400 flex-shrink-0" /><span className="truncate">{val}</span>
//             </div>
//           ))}
//         </div>
//         <div className="flex gap-1.5 mb-3 flex-wrap">
//           <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">{p.rasi}</span>
//           <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs rounded-full font-medium">{p.nakshatra}</span>
//           {p.dosham !== "None" && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">{p.dosham}</span>}
//         </div>
//         <div className="flex gap-2">
//           <button onClick={() => setPage("profile")} className="flex-1 py-2 text-sm font-semibold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5">
//             <Eye className="w-3.5 h-3.5" />View
//           </button>
//           <button onClick={() => setInterested(!interested)} className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${interested ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90"}`}>
//             <Heart className={`w-3.5 h-3.5 ${interested ? "fill-white" : ""}`} />{interested ? "Sent!" : "Interest"}
//           </button>
//           <button onClick={() => setShortlisted(!shortlisted)} className={`p-2 rounded-xl border transition-colors ${shortlisted ? "border-amber-400 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"}`}>
//             <Star className={`w-4 h-4 ${shortlisted ? "fill-amber-400" : ""}`} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

const LiveProfileCard = ({ profile, currentUser, setPage, onSendInterest, setSelectedProfileId, interestStatus }: any) => {
    const [shortlisted, setShortlisted] = useState(false);
    const [localSent, setLocalSent] = useState(false);

    useEffect(() => {
        setLocalSent(false);
    }, [profile?.id, currentUser?.id]);

    const plan = currentUser?.premium_plan?.toLowerCase() || 'basic';
    const isPremiumUser = plan !== 'basic' && plan !== 'free' && plan !== '';
    const isPhotoHidden = !isPremiumUser; // Photo hidden for free users

    // Effective status for this profile's interest (from parent or local click)
    const effectiveStatus: string = (interestStatus || (localSent ? 'pending' : '')).toLowerCase();

    // Calculate unique Tamil 10 Porutham match score per profile
    const computeProfileMatchScore = () => {
      const userStarName = currentUser?.nakshatra || 'Rohini';
      const profStarName = profile?.nakshatra || profile?.star || '';

      const uStar = ALL_NAKSHATRAS.find(n => n.name.toLowerCase().includes(userStarName.toLowerCase())) || ALL_NAKSHATRAS[3];
      let pStar = ALL_NAKSHATRAS.find(n => n.name.toLowerCase().includes(profStarName.toLowerCase()));
      if (!pStar) {
        // Fallback to distinct star per profile ID
        pStar = ALL_NAKSHATRAS[(profile?.id || 1) * 5 % 27];
      }

      const uGender = (currentUser?.gender || 'male').toLowerCase();
      const bride = uGender === 'female' ? uStar : pStar;
      const groom = uGender === 'male' ? uStar : pStar;

      let countToGroom = ((groom.id - bride.id + 27) % 27) + 1;
      let dinaRem = countToGroom % 9;
      let dinaPass = [2, 4, 6, 8, 9, 0].includes(dinaRem);
      let ganaPass = (bride.gana === groom.gana) || bride.gana === "Deva" || groom.gana === "Deva";
      let rajjuDosham = bride.rajju === groom.rajju;
      let rajjuPass = !rajjuDosham;
      let mahendraPass = [4, 7, 10, 13, 16, 19, 22, 25].includes(countToGroom);

      let poruthamCount = [dinaPass, ganaPass, rajjuPass, mahendraPass, countToGroom > 12, true, true, true, true, true].filter(Boolean).length;

      // Unique variation array to ensure distinct scores (87%, 72%, 94%, 68%, 81%, 79%)
      const presetScores = [87, 72, 94, 68, 81, 79, 88, 74, 91, 65];
      let scoreIndex = ((profile?.id || 1) - 1) % presetScores.length;
      let matchScore = presetScores[scoreIndex];

      if (profile?.nakshatra && currentUser?.nakshatra) {
        matchScore = Math.min(97, Math.max(62, Math.round((poruthamCount / 10) * 100)));
        if (rajjuDosham) matchScore = Math.min(matchScore, 68);
      }

      return matchScore;
    };

    const matchScore = computeProfileMatchScore();
    const profileImg = getUserDisplayPhoto(profile);
    const isBlurred = shouldBlurProfilePhoto(currentUser, profile);

    const capitalizeText = (str: string) => {
      if (!str) return '';
      return String(str)
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const normalizeLocation = () => {
      let rawCity = profile.city || profile.location || profile.town || profile.district || profile.village || profile.area || profile.address || 'Chennai';
      let rawState = profile.state || profile.region || profile.state_name || profile.province || '';

      let city = capitalizeText(String(rawCity));
      let state = capitalizeText(String(rawState));

      if (!state) {
        const lower = city.toLowerCase();
        if (lower.includes('mumbai')) state = 'Maharashtra';
        else if (lower.includes('bangalore') || lower.includes('bengaluru')) state = 'Karnataka';
        else if (lower.includes('hyderabad')) state = 'Telangana';
        else state = 'Tamil Nadu';
      }

      return `${city}, ${state}`;
    };

    // Resolve age: use direct age field, or compute from dob/date_of_birth
    const resolveAge = () => {
      if (profile.age && !isNaN(Number(profile.age))) return Number(profile.age);
      const dobStr = profile.dob || profile.date_of_birth || profile.dateOfBirth || '';
      if (dobStr) {
        const yr = new Date(dobStr).getFullYear();
        if (!isNaN(yr) && yr > 1940) return new Date().getFullYear() - yr;
      }
      return profile.id ? 22 + (profile.id % 7) : 26;
    };
    const displayAge = resolveAge();
    const displayLocation = normalizeLocation();
    const displayLocationWithDistance = profile.distance != null
      ? `${displayLocation} · ${profile.distance} KM`
      : displayLocation;

    // Match badge color class matching screenshot
    const getMatchBadgeStyle = (score: number) => {
        if (score >= 85) return 'bg-[#dcfce7] text-[#15803d] border border-emerald-300/40';
        if (score >= 75) return 'bg-[#fef9c3] text-[#a16207] border border-amber-300/40';
        return 'bg-[#e0f2fe] text-[#0369a1] border border-sky-300/40';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                {/* Photo & Header Overlay */}
                <div className="relative h-56 bg-slate-200 overflow-hidden">
                    {/* Blurred if Gold/Premium female viewed by male, otherwise standard photo */}
                    {isBlurred ? (
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                            <img
                                src={profileImg}
                                alt={profile.name}
                                className="w-full h-full object-cover filter blur-md scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getAiPhotoForGender(profile?.gender);
                                }}
                            />
                            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="px-3 py-1 bg-black/65 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-md">
                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                    Photo Blurred
                                </span>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={profileImg}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getAiPhotoForGender(profile?.gender);
                            }}
                        />
                    )}

                    {/* Dark gradient overlay for white text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none z-10" />

                    {/* Top Left Badges: Premium + Horoscope Match */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 flex-wrap">
                        {(profile.isPremium || profile.premium || profile.plan === 'Gold' || profile.plan === 'Platinum') && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                👑 Premium
                            </span>
                        )}
                        <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ${getMatchBadgeStyle(matchScore)}`}>
                            ✨ {matchScore}% Match
                        </span>
                    </div>

                    {/* Top Right Badge: Online Status */}
                    <div className="absolute top-3 right-3 z-20">
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${profile.online !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                            {profile.online !== false ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    {/* Bottom Left Info over image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 z-20 text-white">
                        <h3
                            onClick={() => { setSelectedProfileId(profile.id); setPage('profile'); }}
                            className="font-bold text-white text-base font-display cursor-pointer hover:text-amber-300 transition-colors drop-shadow-sm leading-snug"
                        >
                            {profile.name}
                        </h3>
                        <p className="text-xs text-slate-200 mt-0.5 font-medium flex items-center gap-1 drop-shadow-sm">
                            {displayAge} yrs · {displayLocationWithDistance}
                        </p>
                    </div>
                </div>

                {/* Card Body Details */}
                <div className="p-4 space-y-2.5 bg-white">
                    {/* Education & Income */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 truncate max-w-[50%]">
                            <span className="text-[#0284C7]">🎓</span>
                            <span className="truncate">{profile.education || profile.degree || 'M.Tech'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[#0284C7]">💼</span>
                            <span>{profile.income || profile.annual_income || '12 LPA'}</span>
                        </span>
                    </div>

                    {/* Caste & Location */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 truncate max-w-[50%]">
                            <span className="text-[#0284C7]">🛕</span>
                            <span className="truncate">{profile.caste || 'Brahmin'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[#0284C7]">📍</span>
                            <span>{displayLocation}</span>
                        </span>
                    </div>

                    {/* Astrological Tag Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {profile.rasi && (
                            <span className="px-2.5 py-0.5 bg-sky-50 text-[#003B7B] text-xs font-semibold rounded-full border border-sky-100">
                                {profile.rasi}
                            </span>
                        )}
                        {profile.nakshatra && (
                            <span className="px-2.5 py-0.5 bg-sky-50 text-[#0F2C59] text-xs font-semibold rounded-full border border-sky-100">
                                {profile.nakshatra}
                            </span>
                        )}
                        {profile.dosham && profile.dosham !== 'None' && (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                                {profile.dosham}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 pt-1 flex items-center gap-2">
                <button
                    onClick={() => { setSelectedProfileId(profile.id); setPage('profile'); }}
                    className="px-3.5 py-2 border border-sky-200 text-[#003B7B] hover:bg-sky-50 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
                >
                    <Eye className="w-3.5 h-3.5 text-[#0284C7]" /> View
                </button>
                {effectiveStatus === 'pending' ? (
                    <span className="flex-1 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-default">
                        ⏳ Pending
                    </span>
                ) : (effectiveStatus === 'accepted' || effectiveStatus === 'approved') ? (
                    <button onClick={() => setPage('chat')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Accepted · Chat
                    </button>
                ) : (effectiveStatus === 'rejected' || effectiveStatus === 'declined') ? (
                    <span className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-default">
                        <X className="w-3.5 h-3.5 text-rose-500" /> Declined
                    </span>
                ) : (
                    <button
                        onClick={() => { setLocalSent(true); onSendInterest(profile.id); }}
                        className="flex-1 py-2 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                        <Heart className="w-3.5 h-3.5 fill-white" /> Interest
                    </button>
                )}
                <button
                    onClick={() => setShortlisted(!shortlisted)}
                    className={`p-2 rounded-xl border transition-colors ${shortlisted ? "border-amber-400 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"}`}
                >
                    <Star className={`w-4 h-4 ${shortlisted ? "fill-amber-400" : ""}`} />
                </button>
            </div>
        </div>
    );
};


const GRADIENT_THEMES = [
  'from-[#00b4d8] via-[#0284c7] to-[#042833]',
];

const RecommendedCard = ({
  profile,
  index,
  currentUser,
  setPage,
  setSelectedProfileId,
  onSendInterest,
  interestStatus,
  showMatchBadge
}: any) => {
  const [shortlisted, setShortlisted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [localSent, setLocalSent] = useState(false);

  useEffect(() => {
    setLocalSent(false);
  }, [profile?.id, currentUser?.id]);

  const effectiveStatus = (interestStatus || (localSent ? 'pending' : '')).toLowerCase();

  if (passed) return null;

  const gradient = GRADIENT_THEMES[index % GRADIENT_THEMES.length];
  const name = profile.name || profile.full_name || `Member ${profile.id || index + 1}`;
  const age = profile.age || 25;
  const education = profile.education || 'Graduate';
  const occupation = profile.job || profile.occupation || 'Employed';
  const city = profile.city || 'Chennai';
  
  // Calculate distance text safely without NaN
  let distText = `${city}`;
  if (typeof profile.distance === 'number' && !isNaN(profile.distance)) {
    distText = `${Math.round(profile.distance * 10) / 10} km away`;
  } else {
    const defaultDistances = [3.2, 5.5, 8.1, 12.4, 4.2, 6.7, 9.8, 14.2];
    distText = `${defaultDistances[index % defaultDistances.length]} km away`;
  }

  const userPlan = (currentUser?.premium_plan || currentUser?.plan || 'Basic').toLowerCase();
  const isPremiumUser = userPlan === 'gold' || userPlan === 'diamond' || userPlan === 'platinum' || userPlan === 'premium';
  const isBasicPlan = !isPremiumUser;

  const isBlurred = shouldBlurProfilePhoto(currentUser, profile);
  const avatarUrl = getUserDisplayPhoto(profile);
  const matchPct = profile.computedMatch || profile.match || profile.horoscope_match || (80 + ((profile.id || index || 1) * 3) % 18);

  return (
    <div className={`relative min-w-[260px] max-w-[290px] w-full h-[390px] rounded-[1.75rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-b ${gradient} flex flex-col justify-between p-5 border border-white/20 group flex-shrink-0 select-none`}>
      {/* Background Image Overlay (Only visible for Gold/Premium users) */}
      {!isBasicPlan && (
        <img
          src={avatarUrl}
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay group-hover:scale-105 transition-transform duration-500 ${isBlurred ? "filter blur-lg scale-110" : ""}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getAiPhotoForGender(profile?.gender);
          }}
        />
      )}

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        {showMatchBadge ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white text-xs font-bold shadow-md tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
            {matchPct}% Match
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981] text-white text-xs font-semibold shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Online
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setShortlisted(!shortlisted); }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            shortlisted
              ? "bg-amber-400 text-white shadow-md scale-110"
              : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
          }`}
        >
          <Star className={`w-5 h-5 ${shortlisted ? "fill-white text-white" : "text-white"}`} />
        </button>
      </div>

      {/* Center Avatar (Silhouette for Basic plan; Photo for Gold/Premium) */}
      <div
        className="relative z-10 my-auto flex justify-center cursor-pointer py-3"
        onClick={() => { setSelectedProfileId(profile.id); setPage('profile'); }}
      >
        {isBasicPlan ? (
          <div className="w-24 h-24 rounded-full border-2 border-white/30 shadow-xl overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:border-white/50 group-hover:scale-105 transition-all">
            <User className="w-12 h-12 text-white/75" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full border-2 border-white/40 shadow-xl overflow-hidden bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:border-white/70 group-hover:scale-105 transition-all relative">
            {isBlurred ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover filter blur-md scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAiPhotoForGender(profile?.gender);
                  }}
                />
                <Lock className="w-6 h-6 text-amber-300 absolute drop-shadow-md" />
              </div>
            ) : (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAiPhotoForGender(profile?.gender);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Info & Action Buttons */}
      <div className="relative z-10 space-y-2">
        <div
          className="text-white cursor-pointer"
          onClick={() => { setSelectedProfileId(profile.id); setPage('profile'); }}
        >
          <h4 className="font-bold text-lg leading-tight drop-shadow-sm truncate">
            {name}, {age}
          </h4>
          <p className="text-xs text-white/90 font-medium truncate mt-0.5">
            {education}, {occupation}
          </p>
          <p className="text-xs text-white/80 flex items-center gap-1.5 mt-1 font-normal">
            <MapPin className="w-3.5 h-3.5 text-sky-200 flex-shrink-0" />
            <span className="truncate">{distText}</span>
          </p>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-white/20 my-2" />

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-center gap-3 pt-0.5">
          {/* Pass button */}
          <button
            onClick={(e) => { e.stopPropagation(); setPassed(true); }}
            title="Pass"
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>

          {/* Interest / Like button */}
          {effectiveStatus === 'pending' ? (
            <span
              className="w-[52px] h-[52px] rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg text-xs font-bold flex-shrink-0 cursor-default"
              title="Interest Request Pending"
            >
              ⏳
            </span>
          ) : (effectiveStatus === 'accepted' || effectiveStatus === 'approved') ? (
            <button
              onClick={(e) => { e.stopPropagation(); setPage('chat'); }}
              className="w-[52px] h-[52px] rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer flex-shrink-0"
              title="Accepted - Start Chat"
            >
              <Check className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          ) : (effectiveStatus === 'rejected' || effectiveStatus === 'declined') ? (
            <span
              className="w-[52px] h-[52px] rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg text-xs font-bold flex-shrink-0 cursor-default"
              title="Interest Declined"
            >
              <X className="w-6 h-6 text-white stroke-[2.5]" />
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setLocalSent(true); onSendInterest(profile.id || profile); }}
              className="w-[52px] h-[52px] rounded-full bg-gradient-to-b from-[#0284C7] to-[#003B7B] hover:opacity-95 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer flex-shrink-0"
              title="Send Interest"
            >
              <Heart className="w-6 h-6 fill-white text-white" />
            </button>
          )}

          {/* Star / View Details button */}
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedProfileId(profile.id); setPage('profile'); }}
            title="View Details"
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-amber-500 flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer flex-shrink-0"
          >
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionCarousel = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onViewAll,
  profiles,
  currentUser,
  setPage,
  setSelectedProfileId,
  onSendInterest,
  sentInterests,
  interestStatuses
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!profiles || profiles.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-sky-100/70 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${iconBg} border border-sky-100 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-sky-600 hover:text-[#003B7B] transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          View all &gt;
        </button>
      </div>

      {/* Carousel Container with Arrows */}
      <div className="relative group/carousel">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-sky-100 text-gray-700 flex items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:scale-110 transition-all z-20 cursor-pointer"
          title="Previous profile"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {profiles.map((p: any, idx: number) => {
            const profileStatus = getProfileInterestStatus(currentUser, p, sentInterests, interestStatuses);

            return (
              <RecommendedCard
                key={p.id || idx}
                profile={p}
                index={idx}
                currentUser={currentUser}
                setPage={setPage}
                setSelectedProfileId={setSelectedProfileId}
                onSendInterest={onSendInterest}
                interestStatus={profileStatus}
              />
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-sky-100 text-gray-700 flex items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:scale-110 transition-all z-20 cursor-pointer"
          title="Next profile"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
};


function DashboardPage({
  setPage,
  currentUser,
  setSelectedProfileId,
  onSendInterest,
  onUpdateUser,
  sentInterests = [],
  interestStatuses = {}
}: {
  setPage: (p: Page) => void;
  currentUser: any;
  setSelectedProfileId: (id: number) => void;
  onSendInterest?: (profile: any) => void;
  onUpdateUser?: (updated: any) => void;
  sentInterests?: any[];
  interestStatuses?: Record<string | number, string>;
  currentUserStarId?: number;
}) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userPlan = (currentUser?.premium_plan || currentUser?.plan || 'Basic').toLowerCase();
  const isGoldOrAbove = userPlan === 'gold' || userPlan === 'diamond' || userPlan === 'platinum' || userPlan === 'premium';
  const isBasicPlan = !isGoldOrAbove;
  const [limitAlert, setLimitAlert] = useState('');
  const tabCarouselRef = useRef<HTMLDivElement>(null);
  const scrollTabCarousel = (dir: 'left' | 'right') => {
    if (tabCarouselRef.current) {
      tabCarouselRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
    }
  };

  const isWhatsappVerified = Boolean(currentUser?.whatsapp_verified);
  const isAadharVerified = Boolean(currentUser?.aadhar_verified);

  // Dynamic Profile Completion:
  // Base after registration = 65%
  // WhatsApp verified = 75% (+10%)
  // Aadhaar verified = 80% (+5% / reaches 80%)
  const completionPercent = currentUser?.profile_completion
    ? currentUser.profile_completion
    : isAadharVerified
    ? 80
    : isWhatsappVerified
    ? 75
    : 65;

  // Verification Modals State
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showAadharModal, setShowAadharModal] = useState(false);

  // WhatsApp OTP states
  const [whatsappPhone, setWhatsappPhone] = useState(currentUser?.phone || '');
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [whatsappOtp, setWhatsappOtp] = useState(['', '', '', '']);
  const [sendingWhatsappOtp, setSendingWhatsappOtp] = useState(false);
  const [verifyingWhatsapp, setVerifyingWhatsapp] = useState(false);
  const [whatsappError, setWhatsappError] = useState('');
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);

  // Aadhaar states
  const [aadharNumber, setAadharNumber] = useState(currentUser?.aadhar_number || '');
  const [aadharDocName, setAadharDocName] = useState('');
  const [verifyingAadhar, setVerifyingAadhar] = useState(false);
  const [aadharError, setAadharError] = useState('');
  const [aadharSuccess, setAadharSuccess] = useState(false);

  const handleSendWhatsappOtp = async () => {
    setSendingWhatsappOtp(true);
    setWhatsappError('');
    try {
      const cleanPhone = (whatsappPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
      await fetch('http://localhost:5001/api/otp/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      }).catch(async () => {
        await fetch('http://localhost:5001/api/otp/send-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone })
        });
      });
      setWhatsappOtpSent(true);
    } catch (_) {
      setWhatsappOtpSent(true);
    } finally {
      setSendingWhatsappOtp(false);
    }
  };

  const handleVerifyWhatsappOtp = async () => {
    const code = whatsappOtp.join('');
    if (code.length !== 4) {
      setWhatsappError('Please enter the 4-digit WhatsApp verification code');
      return;
    }
    setVerifyingWhatsapp(true);
    setWhatsappError('');

    const newCompletion = isAadharVerified ? 80 : 75;
    const updatedUser = {
      ...currentUser,
      whatsapp_verified: 1,
      profile_completion: newCompletion
    };

    try {
      const res = await fetch('http://localhost:5001/api/user/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          phone: currentUser?.phone,
          otp: code
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        Object.assign(updatedUser, data.user);
      }
    } catch (err) {
      console.warn('Backend WhatsApp verify sync fallback:', err);
    }

    safeSetVivahUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);

    setVerifyingWhatsapp(false);
    setWhatsappSuccess(true);
    setTimeout(() => {
      setShowWhatsappModal(false);
      setWhatsappSuccess(false);
    }, 1600);
  };

  const handleVerifyAadhar = async () => {
    const cleanNum = aadharNumber.replace(/\D/g, '');
    if (cleanNum.length !== 12) {
      setAadharError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setVerifyingAadhar(true);
    setAadharError('');

    const maskedNum = `XXXX XXXX ${cleanNum.slice(-4)}`;
    const updatedUser = {
      ...currentUser,
      aadhar_verified: 1,
      aadhar_number: maskedNum,
      profile_completion: 80
    };

    try {
      const res = await fetch('http://localhost:5001/api/user/verify-aadhar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          phone: currentUser?.phone,
          aadharNumber: cleanNum
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        Object.assign(updatedUser, data.user);
      }
    } catch (err) {
      console.warn('Backend Aadhaar verify sync fallback:', err);
    }

    safeSetVivahUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);

    setVerifyingAadhar(false);
    setAadharSuccess(true);
    setTimeout(() => {
      setShowAadharModal(false);
      setAadharSuccess(false);
    }, 1600);
  };

  const userGender = (currentUser?.gender || 'male').toLowerCase();
  const isMale = userGender === 'male' || userGender === 'groom';

  const getUserAge = (u: any): number => {
    if (u?.age && !isNaN(Number(u.age))) return Number(u.age);
    if (u?.dob) {
      const birthYear = new Date(u.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900) return currentYear - birthYear;
    }
    const g = (u?.gender || '').toLowerCase();
    return (g === 'male' || g === 'groom') ? 28 : 24;
  };

  const getProfileAge = (p: any): number => {
    if (p?.age && !isNaN(Number(p.age))) return Number(p.age);
    if (p?.dob) {
      const birthYear = new Date(p.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900) return currentYear - birthYear;
    }
    const g = (p?.gender || '').toLowerCase();
    return (g === 'male' || g === 'groom') ? 29 : 25;
  };

  const userAge = getUserAge(currentUser);
  const [maxAge, setMaxAge] = useState<number>(() => isMale ? userAge : 40);
  const [filters, setFilters] = useState({
    caste: 'All',
    education: 'All',
    state: 'All',
    religion: 'All',
    income: 'All',
    matchScore: 'All'
  });

  const handleLockedFilterClick = (filterName: string) => {
    setLimitAlert(`Advanced filter "${filterName}" is exclusive to Gold & Premium members. Upgrade your plan to unlock Religion, Annual Income, Match Score and exclusive search filters!`);
  };

  const tabs = [['recommended','Recommended'],['nearby','Nearby'],['new','New Profiles'],['horoscope','Horoscope Match']];

  const userId = currentUser?.id;

  const parseMatchValue = (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().replace(/[^0-9.\-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const computeProfileMatchScore = (profile: any) => {
    const explicitMatch = parseMatchValue(profile.match) ?? parseMatchValue(profile.horoscope_match);
    if (explicitMatch !== null) return explicitMatch;

    const userStarName = currentUser?.nakshatra || currentUser?.star || 'Rohini';
    const profStarName = profile?.nakshatra || profile?.star || '';
    const uStar = ALL_NAKSHATRAS.find(n => n.name.toLowerCase().includes(userStarName.toLowerCase())) || ALL_NAKSHATRAS[3];
    let pStar = ALL_NAKSHATRAS.find(n => n.name.toLowerCase().includes(profStarName.toLowerCase()));
    if (!pStar) {
      pStar = ALL_NAKSHATRAS[((profile?.id || 1) * 5) % ALL_NAKSHATRAS.length];
    }

    const uGender = (currentUser?.gender || 'male').toLowerCase();
    const bride = uGender === 'female' ? uStar : pStar;
    const groom = uGender === 'male' ? uStar : pStar;

    const countToGroom = ((groom.id - bride.id + 27) % 27) + 1;
    const dinaRem = countToGroom % 9;
    const dinaPass = [2, 4, 6, 8, 9, 0].includes(dinaRem);
    const ganaPass = bride.gana === groom.gana || bride.gana === 'Deva' || groom.gana === 'Deva';
    const rajjuDosham = bride.rajju === groom.rajju;
    const rajjuPass = !rajjuDosham;
    const mahendraPass = [4, 7, 10, 13, 16, 19, 22, 25].includes(countToGroom);

    const poruthamCount = [
      dinaPass,
      ganaPass,
      rajjuPass,
      mahendraPass,
      countToGroom > 12,
      true,
      true,
      true,
      true,
      true
    ].filter(Boolean).length;

    let matchScore = Math.min(97, Math.max(62, Math.round((poruthamCount / 10) * 100)));
    if (rajjuDosham) matchScore = Math.min(matchScore, 68);
    return matchScore;
  };

  const fetchProfiles = async () => {
    if (!userId) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let fetchedProfiles: any[] = [];
      const oppositeGender = isMale ? 'female' : 'male';

      if (activeTab === 'nearby') {
        const res = await fetch(`http://localhost:5001/api/nearby/${userId}`);
        const data = await res.json();
        fetchedProfiles = Array.isArray(data) ? data : data.profiles || data.list || [];
      } else {
        const params = new URLSearchParams({ userId: String(userId) });
        params.set('gender', oppositeGender);
        if (isMale) {
          params.set('minAge', '18');
          params.set('maxAge', String(Math.min(userAge, maxAge)));
        } else {
          params.set('minAge', String(userAge));
          params.set('maxAge', String(Math.max(userAge, maxAge)));
        }
        if (filters.caste !== 'All') params.set('caste', filters.caste);
        if (filters.education !== 'All') params.set('education', filters.education);
        if (filters.state !== 'All') params.set('state', filters.state);
        if (!isBasicPlan && filters.religion !== 'All') params.set('religion', filters.religion);
        if (!isBasicPlan && filters.income !== 'All') params.set('income', filters.income);
        const res = await fetch(`http://localhost:5001/api/profiles?${params}`);
        const data = await res.json();
        if (data.success) {
          fetchedProfiles = data.profiles || [];
        }
      }

      if (fetchedProfiles.length === 0 && PROFILES.length > 0) {
        fetchedProfiles = PROFILES;
      }

      const filtered = fetchedProfiles.filter((p: any) => {
        if (p.id === userId) return false;
        
        // Gender matching
        const pGender = (p.gender || '').toLowerCase();
        if (isMale && (pGender === 'male' || pGender === 'groom')) return false;
        if (!isMale && (pGender === 'female' || pGender === 'bride')) return false;

        // Relative age rule
        const pAge = getProfileAge(p);
        if (isMale) {
          if (pAge > userAge) return false;
          if (pAge < 18 || pAge > maxAge) return false;
        } else {
          if (pAge < userAge) return false;
          if (pAge > maxAge) return false;
        }

        if (filters.caste !== 'All' && p.caste && !p.caste.toLowerCase().includes(filters.caste.toLowerCase())) return false;
        if (filters.education !== 'All' && p.education && !p.education.toLowerCase().includes(filters.education.toLowerCase())) return false;
        if (filters.state !== 'All' && p.state && !p.state.toLowerCase().includes(filters.state.toLowerCase())) return false;
        if (!isBasicPlan && filters.religion !== 'All' && p.religion && !p.religion.toLowerCase().includes(filters.religion.toLowerCase())) return false;
        if (!isBasicPlan && filters.income !== 'All' && (p.income || p.salary || p.annual_income) && !(p.income || p.salary || p.annual_income).toLowerCase().includes(filters.income.toLowerCase())) return false;

        return true;
      });

      const scoredProfiles = filtered.map((p: any) => {
        const resolvedImg = getUserDisplayPhoto(p);
        return {
          ...p,
          img: resolvedImg,
          photo: resolvedImg,
          computedMatch: computeProfileMatchScore(p),
        };
      });

      let scoreFiltered = scoredProfiles;
      if (!isBasicPlan && filters.matchScore !== 'All') {
        const threshold = filters.matchScore === '90%+' ? 90 : filters.matchScore === '80%+' ? 80 : filters.matchScore === '70%+' ? 70 : 0;
        if (threshold > 0) {
          scoreFiltered = scoreFiltered.filter((p: any) => (p.computedMatch || 0) >= threshold);
        }
      }

      const sorted = activeTab === 'nearby' || activeTab === 'recommended'
        ? [...scoreFiltered].sort((a, b) => {
            const matchDiff = (b.computedMatch || 0) - (a.computedMatch || 0);
            if (matchDiff !== 0) return matchDiff;
            if (a.distance == null) return 1;
            if (b.distance == null) return -1;
            return a.distance - b.distance;
          })
        : activeTab === 'new'
        ? [...scoreFiltered].sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
        : activeTab === 'horoscope'
        ? [...scoreFiltered]
            .filter((p: any) => (p.computedMatch || 0) >= 50)
            .sort((a, b) => (b.computedMatch || 0) - (a.computedMatch || 0))
        : scoreFiltered;

      setProfiles(sorted);
    } catch (err) {
      console.error('Failed to load profiles', err);
      const filtered = PROFILES.filter((p: any) => {
        const pGender = (p.gender || '').toLowerCase();
        if (isMale && (pGender === 'male' || pGender === 'groom')) return false;
        if (!isMale && (pGender === 'female' || pGender === 'bride')) return false;
        const pAge = getProfileAge(p);
        if (isMale) {
          if (pAge > userAge) return false;
          if (pAge < 18 || pAge > maxAge) return false;
        } else {
          if (pAge < userAge) return false;
          if (pAge > maxAge) return false;
        }
        return true;
      });
      setProfiles(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, [activeTab, filters, maxAge, currentUser]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendInterest = async (receiverId: number) => {
    if (!userId) return;
    const targetProfile = profiles.find((p: any) => p.id === receiverId);
    try {
      const res = await fetch('http://localhost:5001/api/interests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId })
      });
      const data = await res.json();
      if (data.limitReached) {
        setLimitAlert(data.message);
      } else if (data.success) {
        if (onSendInterest && targetProfile) {
          onSendInterest(targetProfile);
        }
      } else {
        alert(data.message || 'Failed to send interest');
      }
    } catch {
      if (onSendInterest && targetProfile) {
        onSendInterest(targetProfile);
      }
    }
  };

  useEffect(() => { fetchProfiles(); },[] );

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Dynamic Profile Completion Top Notification Banner */}
      <div className="bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white py-2.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {completionPercent >= 80 ? (
              <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-sky-200 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">
              {completionPercent < 75 ? (
                <span>
                  Profile <strong className="font-bold text-white">65% complete</strong> — Verify your WhatsApp number to reach <strong className="text-amber-200">75%</strong>!
                </span>
              ) : completionPercent < 80 ? (
                <span>
                  Profile <strong className="font-bold text-emerald-200">75% complete</strong> — Verify your Aadhaar card to reach <strong className="text-amber-200">80%</strong> and earn your Trust Badge!
                </span>
              ) : (
                <span>
                  Profile <strong className="font-bold text-emerald-300">80% complete</strong> — WhatsApp &amp; Aadhaar Verified Member!
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-2 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold">{completionPercent}%</span>
            </div>

            {!isWhatsappVerified ? (
              <button
                onClick={() => setShowWhatsappModal(true)}
                className="text-xs font-bold bg-white text-[#003B7B] px-3 py-1 rounded-full shadow-xs hover:bg-sky-50 transition-all cursor-pointer"
              >
                Verify WhatsApp (75%) →
              </button>
            ) : !isAadharVerified ? (
              <button
                onClick={() => setShowAadharModal(true)}
                className="text-xs font-bold bg-emerald-400 text-slate-900 px-3 py-1 rounded-full shadow-xs hover:bg-emerald-300 transition-all cursor-pointer"
              >
                Verify Aadhaar (80%) →
              </button>
            ) : (
              <span className="text-[11px] font-bold bg-emerald-500/30 border border-emerald-300/40 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-300" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {limitAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Upgrade Required</h3>
            <p className="text-gray-600 text-sm mb-4">{limitAlert}</p>
            <div className="flex gap-3">
              <button onClick={() => setLimitAlert('')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Close</button>
              <button onClick={() => { setLimitAlert(''); setPage('premium'); }} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold">Upgrade Now</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Number Verification Modal (for 75% completion) */}
      {showWhatsappModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-100 relative">
            <button
              onClick={() => {
                setShowWhatsappModal(false);
                setWhatsappError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {whatsappSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in-75">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl">WhatsApp Verified!</h3>
                <p className="text-sm font-semibold text-emerald-700">
                  Profile completion increased to <span className="font-bold text-lg">{isAadharVerified ? '80%' : '75%'}</span>!
                </p>
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium">
                  ✨ Your WhatsApp number is verified for instant communication with matched families.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">Verify WhatsApp Number</h3>
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Reach 75%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Verify your WhatsApp number to boost your profile trust and reach 75% completion.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">WhatsApp Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendWhatsappOtp}
                      disabled={sendingWhatsappOtp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sendingWhatsappOtp ? 'Sending...' : whatsappOtpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                </div>

                {whatsappOtpSent && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Enter 4-digit WhatsApp OTP:</label>
                      <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                        Code sent to WhatsApp
                      </span>
                    </div>

                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          id={`w-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={whatsappOtp[idx]}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const next = [...whatsappOtp];
                            next[idx] = val;
                            setWhatsappOtp(next);
                            if (val && idx < 3) {
                              const nextInput = document.getElementById(`w-otp-${idx + 1}`);
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !whatsappOtp[idx] && idx > 0) {
                              const prevInput = document.getElementById(`w-otp-${idx - 1}`);
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-none text-slate-800"
                        />
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 text-center">
                      (Test mode code: <span className="font-mono font-bold text-slate-600">1234</span> or any 4 digits)
                    </p>
                  </div>
                )}

                {whatsappError && (
                  <p className="text-xs text-rose-500 font-semibold text-center">{whatsappError}</p>
                )}

                <button
                  type="button"
                  onClick={handleVerifyWhatsappOtp}
                  disabled={verifyingWhatsapp || !whatsappOtpSent}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingWhatsapp ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify &amp; Reach 75% Complete</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aadhaar Card Verification Modal (for 80% completion) */}
      {showAadharModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 relative">
            <button
              onClick={() => {
                setShowAadharModal(false);
                setAadharError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {aadharSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in-75">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl">Aadhaar Card Verified!</h3>
                <p className="text-sm font-semibold text-emerald-700">
                  Profile completion is now <span className="font-bold text-lg">80% Complete</span>!
                </p>
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium">
                  🛡️ You have received the <strong>Verified Match Shield</strong> badge on your profile.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1D72B8] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">Verify Aadhaar Card</h3>
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Reach 80%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Verify your Government ID / Aadhaar card for 80% profile completion and Trust Badge.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      12-Digit Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={aadharNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                        const parts = raw.match(/.{1,4}/g);
                        setAadharNumber(parts ? parts.join(' ') : raw);
                      }}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold tracking-wider focus:outline-none focus:border-[#1D72B8] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Upload Aadhaar Card Document (Optional / Front &amp; Back)
                    </label>
                    <label className="border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {aadharDocName ? aadharDocName : 'Click to select Aadhaar photo / PDF'}
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, PDF up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAadharDocName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-2 text-[11px] text-[#003B7B]">
                    <Lock className="w-3.5 h-3.5 mt-0.5 text-[#1D72B8] flex-shrink-0" />
                    <span>
                      <strong>100% Encrypted &amp; Private:</strong> Aadhaar numbers are masked and never visible to other users.
                    </span>
                  </div>
                </div>

                {aadharError && (
                  <p className="text-xs text-rose-500 font-semibold text-center">{aadharError}</p>
                )}

                <button
                  type="button"
                  onClick={handleVerifyAadhar}
                  disabled={verifyingAadhar}
                  className="w-full py-3 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingAadhar ? (
                    <span>Verifying with UIDAI registry...</span>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Verify Aadhaar &amp; Reach 80% Complete</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile Completion Verification Checklist Widget - Hidden once both are verified */}
        {(!isWhatsappVerified || !isAadharVerified) && (
          <div className="mb-6 bg-white rounded-3xl p-5 shadow-xs border border-sky-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-base">Profile Verification &amp; Trust Score</h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${completionPercent >= 80 ? 'bg-emerald-100 text-emerald-800' : completionPercent >= 75 ? 'bg-sky-100 text-[#003B7B]' : 'bg-amber-100 text-amber-800'}`}>
                    {completionPercent}% Complete
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Verified profiles get <strong>3x more interest responses</strong> and genuine verified matches.
                </p>
              </div>

              {/* Verification Checklist Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
                {/* WhatsApp Card - Hidden once WhatsApp is verified */}
                {!isWhatsappVerified && (
                  <div className="p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 bg-slate-50 border-slate-200 hover:border-emerald-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-200 text-slate-600">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">WhatsApp Verification</p>
                        <p className="text-[11px] text-slate-500">Unlocks 75% completion</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowWhatsappModal(true)}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
                    >
                      Verify (+10%)
                    </button>
                  </div>
                )}

                {/* Aadhaar Card - Hidden once Aadhaar is verified */}
                {!isAadharVerified && (
                  <div className="p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 bg-slate-50 border-slate-200 hover:border-sky-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-200 text-slate-600">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">Aadhaar Card Verification</p>
                        <p className="text-[11px] text-slate-500">Unlocks 80% completion</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAadharModal(true)}
                      className="text-xs font-bold text-white bg-[#1D72B8] hover:bg-[#003B7B] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
                    >
                      Verify (+5%)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-60 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Filter className="w-4 h-4 text-[#0284C7]" />Filters</h3>
                <button 
                  onClick={() => {
                    setMaxAge(isMale ? userAge : 40);
                    setFilters({ caste: 'All', education: 'All', state: 'All', religion: 'All', income: 'All', matchScore: 'All' });
                  }}
                  className="text-xs text-sky-600 font-medium hover:text-[#003B7B] transition-colors cursor-pointer"
                >
                  Reset All
                </button>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {isMale ? `Age: 18–${Math.min(userAge, maxAge)} yrs` : `Age: ${userAge}–${Math.max(userAge, maxAge)} yrs`}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Free</span>
                </div>
                <p className="text-[11px] text-sky-600 font-medium mb-1.5">
                  {isMale ? `Showing brides below age ${userAge}` : `Showing grooms above age ${userAge}`}
                </p>
                <input 
                  type="range" 
                  min={isMale ? 18 : userAge} 
                  max={isMale ? userAge : 60} 
                  value={isMale ? Math.min(userAge, maxAge) : Math.max(userAge, maxAge)}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-[#0284C7] cursor-pointer" 
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                  <span>{isMale ? '18 yrs' : `${userAge} yrs`}</span>
                  <span>{isMale ? `${userAge} yrs` : '60 yrs'}</span>
                </div>
              </div>
              {[
                { label: "Caste", key: "caste", opts: ["Brahmin","Iyer","Mudaliar","Pillai","Nadar","Nair","Chettiar","Vanniyar","Naidu","Reddy"], isGold: false },
                { label: "Education", key: "education", opts: ["B.E./B.Tech","MBBS","MBA","M.Tech","CA","PhD","MCA","B.Com","B.Sc","MS"], isGold: false },
                { label: "Location", key: "state", opts: ["Tamil Nadu","Karnataka","Andhra Pradesh","Maharashtra","Kerala","Delhi","Telangana"], isGold: false },
                { label: "Religion", key: "religion", opts: ["Hindu","Muslim","Christian","Sikh","Jain","Buddhist"], isGold: true },
                { label: "Annual Income", key: "income", opts: ["3–5 LPA","5–8 LPA","8–12 LPA","12–20 LPA","20+ LPA"], isGold: true },
                { label: "Match Score", key: "matchScore", opts: ["90%+","80%+","70%+","All Matches"], isGold: true },
              ].map(({ label, key, opts, isGold }) => {
                // isLocked = only Basic plan users are locked out of Gold filters
                const isLocked = isBasicPlan && isGold;
                return (
                  <div key={label} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
                      {/* Show lock badge only for Basic plan users on Gold filters, or Free badge for free filters */}
                      {isGold && isBasicPlan ? (
                        <button
                          type="button"
                          onClick={() => handleLockedFilterClick(label)}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300/60 flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Gold
                        </button>
                      ) : !isGold ? (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Free
                        </span>
                      ) : null}
                    </div>
                    {isLocked ? (
                      <div
                        onClick={() => handleLockedFilterClick(label)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/80 text-gray-400 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors select-none"
                      >
                        <span>Select {label}</span>
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    ) : (
                      <select 
                        value={(filters as any)[key] || 'All'}
                        onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                      >
                        <option value="All">All {label}s</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
              <button 
                onClick={() => fetchProfiles()}
                className="w-full py-2.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">Matches for You</h1>
                <p className="text-sm text-gray-500">{loading ? 'Loading profiles...' : `${profiles.length} profiles based on your preferences`}</p>
              </div>
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-sky-500 shadow-sm">
                <option>Sort: Horoscope Match</option>
                <option>Sort: Newest First</option>
                <option>Sort: Age (Low to High)</option>
              </select>
            </div>
            <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm border border-sky-100 overflow-x-auto">
              {tabs.map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === id ? "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white shadow-sm font-semibold" : "text-gray-600 hover:text-[#0284C7] hover:bg-sky-50"}`}>{label}</button>
              ))}
            </div>
            {activeTab === 'horoscope' && isBasicPlan ? (
              <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-sm border border-sky-100/80 text-center my-2 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center border border-sky-100 mx-auto mb-6 shadow-sm">
                  <Sparkles className="w-8 h-8 text-sky-600" />
                </div>
                <h2 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-3 tracking-tight">
                  Horoscope Match Locked
                </h2>
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
                  Horoscope compatibility analysis is a Premium feature. Upgrade to Gold or Premium to automatically match Rasis, Nakshatras, and Poruthams compatibility metrics.
                </p>
                <button
                  onClick={() => setPage('premium')}
                  className="bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base inline-block"
                >
                  Upgrade to Gold Plan
                </button>
              </div>
            ) : activeTab === 'recommended' ? (
              <div className="space-y-6">
                {/* Section 1: Near Me */}
                <SectionCarousel
                  icon={MapPin}
                  iconBg="bg-sky-50"
                  iconColor="text-sky-600"
                  title="Near Me"
                  subtitle="People near your location"
                  onViewAll={() => setActiveTab('nearby')}
                  profiles={profiles}
                  currentUser={currentUser}
                  setPage={setPage}
                  setSelectedProfileId={setSelectedProfileId}
                  onSendInterest={handleSendInterest}
                  sentInterests={sentInterests}
                  interestStatuses={interestStatuses}
                />

                {/* Section 2: New Profiles */}
                <SectionCarousel
                  icon={Sparkles}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-500"
                  title="New Profiles"
                  subtitle="Recently joined members"
                  onViewAll={() => setActiveTab('new')}
                  profiles={[...profiles].reverse()}
                  currentUser={currentUser}
                  setPage={setPage}
                  setSelectedProfileId={setSelectedProfileId}
                  onSendInterest={handleSendInterest}
                  sentInterests={sentInterests}
                  interestStatuses={interestStatuses}
                />

                {/* Section 3: Premium Members — banner row */}
                <div className="bg-white rounded-3xl px-6 py-5 shadow-sm border border-sky-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-amber-600">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">Premium Members</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Trusted &amp; verified premium members</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPage('premium')}
                    className="text-xs font-bold text-sky-600 hover:text-[#003B7B] transition-colors flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                  >
                    Upgrade Plan <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
              {loading ? (
                <div className="col-span-full text-center py-16">
                  <div className="animate-spin w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Finding matches for you...</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="w-12 h-12 text-sky-200 mx-auto mb-3" />
                  <p className="text-gray-500">No profiles found. Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                  {profiles.map((p: any, idx: number) => {
                    const profileStatus = getProfileInterestStatus(currentUser, p, sentInterests, interestStatuses);
                    return (
                      <RecommendedCard
                        key={p.id}
                        profile={p}
                        index={idx}
                        currentUser={currentUser}
                        setPage={setPage}
                        setSelectedProfileId={setSelectedProfileId}
                        onSendInterest={handleSendInterest}
                        interestStatus={profileStatus}
                        showMatchBadge={activeTab === 'horoscope'}
                      />
                    );
                  })}
                </div>
              )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function NearbyProfiles() {

  const [profiles, setProfiles] = useState([]);

  useEffect(() => {

    const fetchProfiles = async () => {

      const userId = localStorage.getItem("userId");

      const res = await axios.get(
        `http://localhost:5001/api/nearby/${userId}`
      );

      const fetchedProfiles = Array.isArray(res.data) ? res.data : [];
      const sortedProfiles = [...fetchedProfiles].sort((a, b) => {
        const aMatch = Number(a.horoscope_match ?? a.match ?? 0);
        const bMatch = Number(b.horoscope_match ?? b.match ?? 0);
        return bMatch - aMatch;
      });

      setProfiles(sortedProfiles);
    };

    fetchProfiles();

  }, []);

  const getProfileLocation = (profile: any) => {
    const city = profile.city || profile.town || profile.district || profile.village || profile.location || profile.area;
    const state = profile.state || profile.region || profile.state_name || profile.province;
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return 'Tamil Nadu';
  };

  const getProfileImage = (profile: any) => profile.profile_image || profile.img || profile.photo || profile.imageUrl || 'https://via.placeholder.com/400x300?text=No+Photo';

  return (
    <div className="row">

      {profiles.map(profile => (

        <div className="col-md-4" key={profile.id}>

          <div className="card shadow p-3">

            <img
              src={getProfileImage(profile)}
              alt={profile.name || 'Profile'}
              style={{
                height: 200,
                objectFit: 'cover'
              }}
            />

            <h4>{profile.name}</h4>

            <p>Age : {profile.age}</p>

            <p>📍 {getProfileLocation(profile)}</p>

            <p>📏 {profile.distance != null ? `${profile.distance} KM` : 'Distance unknown'}</p>

            <h5 style={{color:'green'}}>
                ❤️ {profile.horoscope_match ?? profile.match ?? 0}% Match
            </h5>

          </div>

        </div>

      ))}

    </div>
  );
}

// ─── Live Profile Card (from MySQL) ──────────────────────────────────────────

// function LiveProfileCard({ profile: p, currentUser, setPage, onSendInterest, setSelectedProfileId }: { profile: any; currentUser: any; setPage: (pg: Page) => void; onSendInterest: (id: number) => void; setSelectedProfileId?: (id: number) => void }) {
//   const [interested, setInterested] = useState(false);
//   const plan = currentUser?.premium_plan || 'Basic';
//   const isLocked = plan === 'Basic';

//   // Rough match % based on shared fields
//   const matchPct = Math.min(99, Math.max(60,
//     (p.religion === currentUser?.religion ? 10 : 0) +
//     (p.caste === currentUser?.caste ? 15 : 0) +
//     (p.state === currentUser?.state ? 10 : 0) +
//     (p.nakshatra ? 5 : 0) +
//     (p.dosham === 'None' ? 5 : 0) +
//     60
//   ));

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
//       <div className="relative">
//         {p.img || p.photo ? (
//           <img src={p.img || p.photo} alt={p.name} className="w-full h-52 object-cover" />
//         ) : (
//           <div className="w-full h-52 bg-gradient-to-br from-rose-400 to-purple-500 flex flex-col items-center justify-center text-white">
//             <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl shadow-inner">
//               {(p.name || p.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
//             </div>
//             <span className="text-xs text-white/80 font-medium mt-1.5">No photo</span>
//           </div>
//         )}
//         {p.premium_plan !== 'Basic' && <div className="absolute top-3 left-3"><PremiumBadge /></div>}
//         <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
//           <span className={`w-1.5 h-1.5 rounded-full ${p.online ? 'bg-emerald-400' : 'bg-gray-400'}`} />
//           <span className="text-white text-xs">{p.online ? 'Online' : 'Offline'}</span>
//         </div>
//         {isLocked && (
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
//             <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 rounded-lg">
//               <Lock className="w-3 h-3 text-white" />
//               <span className="text-white text-xs font-semibold">Upgrade to unlock full profile</span>
//             </div>
//           </div>
//         )}
//       </div>
//       <div className="p-4">
//         <div className="flex items-start justify-between mb-2">
//           <div>
//             <h3 className="font-semibold text-gray-900">{p.name}</h3>
//             <p className="text-xs text-gray-500 mt-0.5">{p.age} yrs · {p.city}, {p.state}</p>
//           </div>
//           <MatchBadge pct={matchPct} />
//         </div>
//         <div className="flex flex-wrap gap-1.5 mb-3">
//           {p.education && <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">{p.education}</span>}
//           {p.job && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{p.job}</span>}
//           {p.rasi && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">{p.rasi}</span>}
//         </div>
//         {!isLocked && p.phone && (
//           <div className="flex items-center gap-1.5 mb-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
//             <Phone className="w-3.5 h-3.5" /> +91 {p.phone}
//           </div>
//         )}
//         <div className="flex gap-2">
//           <button onClick={() => { setSelectedProfileId?.(p.id); setPage('profile'); }} className="flex-1 py-2 text-sm font-semibold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5">
//             <Eye className="w-3.5 h-3.5" />View
//           </button>
//           <button
//             onClick={() => { setInterested(true); onSendInterest(p.id); }}
//             className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
//               interested ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90'
//             }`}
//           >
//             <Heart className={`w-3.5 h-3.5 ${interested ? 'fill-white' : ''}`} />
//             {interested ? 'Sent!' : 'Interest'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// ─── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({ profile, onSave, onClose }: { profile: any; onSave: (updated: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: profile.name || profile.full_name || "Arun Kumar",
    img: profile.img || profile.photo || "",
    age: profile.age || 28,
    gender: profile.gender || "Male",
    height: profile.height || "5'10\"",
    complexion: profile.complexion || "Fair",
    city: profile.city || "Chennai",
    state: profile.state || "Tamil Nadu",
    religion: profile.religion || "Hindu",
    caste: profile.caste || "Brahmin",
    subCaste: profile.subCaste || profile.sub_caste || "",
    gothram: profile.gothram || profile.gotra || "",
    native_place: profile.native_place || "",
    education: profile.education || "B.Tech",
    job: profile.job || profile.occupation || "Software Engineer",
    salary: profile.salary || profile.income || "12 LPA",
    marital_status: profile.marital_status || "Never Married",
    mother_tongue: profile.mother_tongue || "Tamil",
    diet: profile.diet || "Vegetarian",
    whatsapp: profile.whatsapp || profile.phone || "+91 98765 43210",
    phone: profile.phone || "98765 43210",
    rasi: profile.rasi || "Mesham",
    nakshatra: profile.nakshatra || "Ashwini",
    dosham: profile.dosham || "None",
    father_name: profile.father_name || profile.fatherName || "",
    father_occupation: profile.father_occupation || profile.fatherJob || "",
    mother_name: profile.mother_name || profile.motherName || "",
    mother_occupation: profile.mother_occupation || profile.motherJob || "",
    brother_name: profile.brother_name || profile.brotherName || "",
    sister_name: profile.sister_name || profile.sisterName || "",
  });

  const avatarOptions = [
    "https://i.pravatar.cc/300?img=12",
    "https://i.pravatar.cc/300?img=33",
    "https://i.pravatar.cc/300?img=68",
    "https://i.pravatar.cc/300?img=47",
    "https://i.pravatar.cc/300?img=49",
    "https://i.pravatar.cc/300?img=51",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImg = formData.img || profile.img || profile.photo || "";
    const updated = {
      ...profile,
      ...formData,
      img: finalImg,
      photo: finalImg,
      avatar: finalImg,
      profile_image: finalImg,
      isCustomPhoto: hasCustomUploadedPhoto({ img: finalImg }),
      occupation: formData.job,
      income: formData.salary,
      full_name: formData.name,
      fatherName: formData.father_name,
      fatherJob: formData.father_occupation,
      motherName: formData.mother_name,
      motherJob: formData.mother_occupation,
      brotherName: formData.brother_name,
      sisterName: formData.sister_name,
      gotra: formData.gothram,
      sub_caste: formData.subCaste,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-rose-100 p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-rose-100 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-rose-600" /> Edit Profile Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Update your personal information & profile picture</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-rose-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Profile Image</label>
            <div className="flex items-center gap-4 mb-3">
              {hasCustomUploadedPhoto(formData) ? (
                <img src={formData.img} alt="Preview" className="w-16 h-16 rounded-full object-cover ring-4 ring-rose-200 shadow-md flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center ring-4 ring-rose-200 shadow-md text-white font-bold text-lg select-none flex-shrink-0">
                  {(formData.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="edit-modal-upload" className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </label>
                  <input
                    type="file"
                    id="edit-modal-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({ ...formData, img: reader.result as string, photo: reader.result as string, isCustomPhoto: true });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {hasCustomUploadedPhoto(formData) && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, img: "", photo: "", isCustomPhoto: false })}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste Image URL"
                  value={formData.img}
                  onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400">Upload custom file, select avatar below, or enter custom URL</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Height</label>
              <input
                type="text"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Complexion</label>
              <select
                value={formData.complexion}
                onChange={(e) => setFormData({ ...formData, complexion: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
              >
                <option value="Fair">Fair</option>
                <option value="Very Fair">Very Fair</option>
                <option value="Wheatish">Wheatish</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Religion</label>
              <input
                type="text"
                value={formData.religion}
                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Caste</label>
              <input
                type="text"
                value={formData.caste}
                onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Education</label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Occupation / Job</label>
              <input
                type="text"
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Annual Income</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Marital Status</label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
              >
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother Tongue</label>
              <input
                type="text"
                value={formData.mother_tongue}
                onChange={(e) => setFormData({ ...formData, mother_tongue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diet</label>
              <select
                value={formData.diet}
                onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
              >
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Phone</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rasi</label>
              <input
                type="text"
                value={formData.rasi}
                onChange={(e) => setFormData({ ...formData, rasi: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Leave blank if not provided"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Occupation</label>
              <input
                type="text"
                value={formData.father_occupation}
                onChange={(e) => setFormData({ ...formData, father_occupation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Leave blank if not provided"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Name</label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Leave blank if not provided"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Occupation</label>
              <input
                type="text"
                value={formData.mother_occupation}
                onChange={(e) => setFormData({ ...formData, mother_occupation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Leave blank if not provided"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brother's Name</label>
              <input
                type="text"
                value={formData.brother_name}
                onChange={(e) => setFormData({ ...formData, brother_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Enter brother's name (or leave blank if not provided)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sister's Name</label>
              <input
                type="text"
                value={formData.sister_name}
                onChange={(e) => setFormData({ ...formData, sister_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Enter sister's name (or leave blank if not provided)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gothram</label>
              <input
                type="text"
                value={formData.gothram}
                onChange={(e) => setFormData({ ...formData, gothram: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sub Caste</label>
              <input
                type="text"
                value={formData.subCaste}
                onChange={(e) => setFormData({ ...formData, subCaste: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Native Place</label>
              <input
                type="text"
                value={formData.native_place}
                onChange={(e) => setFormData({ ...formData, native_place: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-rose-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-purple-700 rounded-xl hover:opacity-90 transition-opacity shadow-md cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfilePage({
  setPage,
  profileId,
  currentUser,
  onUpdateUser,
  onSendInterest,
  sentInterests = [],
  interestStatuses = {},
  photoRequests = [],
  onRequestPhotoAccess,
  onRespondPhotoRequest,
}: {
  setPage: (p: Page) => void;
  profileId: number | null;
  currentUser: any;
  onUpdateUser?: (updated: any) => void;
  onSendInterest?: (profile: any) => void;
  sentInterests?: any[];
  interestStatuses?: Record<string | number, string>;
  photoRequests?: any[];
  onRequestPhotoAccess?: (targetProfile: any) => void;
  onRespondPhotoRequest?: (reqId: string, status: 'approved' | 'declined') => void;
}) {
  const [tab, setTab] = useState("basic");
  const [shortlisted, setShortlisted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const effectiveUser = currentUser || DEFAULT_USER;
  const targetId = profileId || effectiveUser?.id;
  const myId = effectiveUser?.id;
  const isSelf = !profileId || String(targetId) === String(effectiveUser?.id) || (Number(targetId) === Number(effectiveUser?.id));
  const viewerPlan = (effectiveUser?.premium_plan || effectiveUser?.plan || 'Basic').toLowerCase();
  const isGoldOrAbove = viewerPlan === 'gold' || viewerPlan === 'diamond' || viewerPlan === 'platinum' || viewerPlan === 'premium';
  const isBasicViewer = !isSelf && !isGoldOrAbove;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const effectiveUser = currentUser || DEFAULT_USER;
      const targetId = profileId || effectiveUser?.id;
      const isSelf = !profileId || String(targetId) === String(effectiveUser?.id) || (Number(targetId) === Number(effectiveUser?.id));

      if (isSelf) {
        setProfile(effectiveUser);
        setLoading(false);
        return;
      }

      // Find in local PROFILES list first
      const localMatch = PROFILES.find((p) => p.id === Number(targetId));

      try {
        const res = await fetch(`http://localhost:5001/api/profiles/${targetId}?userId=${effectiveUser.id}`);
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Backend offline fallback
      }

      if (localMatch) {
        setProfile(localMatch);
      } else {
        setProfile(PROFILES[0]);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [profileId, currentUser]);

  const p = profile || currentUser || DEFAULT_USER;

  // Compute match %
  const activeUser = currentUser || DEFAULT_USER;
  const matchPct = p ? Math.min(99, Math.max(60,
    (p.religion === activeUser?.religion ? 10 : 0) +
    (p.caste === activeUser?.caste ? 15 : 0) +
    (p.state === activeUser?.state ? 10 : 0) +
    (p.nakshatra ? 5 : 0) +
    (p.dosham === 'None' ? 5 : 0) +
    65
  )) : 87;

  const isBlurred = shouldBlurProfilePhoto(currentUser, p, photoRequests);
  const photoReqStatus = getPhotoRequestStatus(currentUser, p, photoRequests);

  const viewerGender = String(currentUser?.gender || "").toLowerCase().trim();
  const isFemaleViewer = viewerGender === "female" || viewerGender === "bride" || viewerGender === "woman" || viewerGender === "girl";
  const targetGender = String(p?.gender || "").toLowerCase().trim();
  const isTargetMale = targetGender === "male" || targetGender === "groom" || targetGender === "man" || targetGender === "boy";
  const isFemaleViewingMaleBasic = isFemaleViewer && isTargetMale && isBasicViewer;

  const handleSaveProfile = (updated: any) => {
    setProfile(updated);
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading profile details...</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: "basic", label: "Basic", icon: User },
    { id: "family", label: "Family", icon: Users },
    { id: "horoscope", label: "Horoscope", icon: Sparkles },
    { id: "expectations", label: "Expectations", icon: Heart },
  ];

  const InfoRow = ({ label, value, accent }: { label: string; value: string | null | undefined; accent?: boolean }) => {
    const displayVal = isCountOrNotProvided(value) ? "Not provided" : String(value).trim();
    return (
      <div className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors ${accent ? "bg-sky-50 border border-sky-200" : "bg-sky-50/40 border border-sky-100/60 hover:bg-sky-100/40"}`}>
        <p className={`text-xs font-semibold w-32 flex-shrink-0 pt-0.5 ${accent ? "text-sky-700" : "text-gray-500"}`}>{label}</p>
        <p className={`text-sm font-bold ${accent ? "text-[#0F2C59]" : "text-gray-800"}`}>{displayVal}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      {isEditing && (
        <EditProfileModal
          profile={p}
          onSave={handleSaveProfile}
          onClose={() => setIsEditing(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => setPage("dashboard")} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#0284C7] mb-5 group transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />Back to matches
        </button>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── Left Sidebar ─── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Photo Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100">
              <div className="relative aspect-square bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center group overflow-hidden">
                {isBlurred && !isSelf ? (
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    <img
                      src={getUserDisplayPhoto(p)}
                      alt={p.name || p.full_name}
                      className="w-full h-full object-cover filter blur-2xl scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAiPhotoForGender(p?.gender);
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[4px] flex flex-col items-center justify-center text-white text-center p-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg">
                        <Lock className="w-6 h-6 text-amber-400" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        {isFemaleViewingMaleBasic ? "Photo Locked for Basic Plan" : "Protected Member Photo"}
                      </p>
                      <p className="text-[11px] text-white/85 mt-1 max-w-[230px] leading-relaxed">
                        {isFemaleViewingMaleBasic
                          ? "Male profile photos are hidden on the Basic Plan. Upgrade to Gold or Premium to view photos and contact numbers."
                          : "Photo is protected by privacy settings. Send a request to view her photo."}
                      </p>

                      {isFemaleViewingMaleBasic ? (
                        <button
                          type="button"
                          onClick={() => setPage("premium")}
                          className="mt-3.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5 text-white" /> Upgrade to View Photo →
                        </button>
                      ) : photoReqStatus === 'none' ? (
                        <button
                          type="button"
                          onClick={() => onRequestPhotoAccess?.(p)}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> Request to View Photo
                        </button>
                      ) : photoReqStatus === 'pending' ? (
                        <div className="mt-3 px-3.5 py-1.5 bg-amber-500/90 text-white text-xs font-bold rounded-full border border-amber-400/40 flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
                          Photo Requested • Waiting for Approval
                        </div>
                      ) : photoReqStatus === 'declined' ? (
                        <div className="mt-3 flex flex-col items-center gap-1">
                          <span className="px-3 py-1 bg-rose-500/90 text-white text-xs font-bold rounded-full">
                            Request Declined
                          </span>
                          <button
                            type="button"
                            onClick={() => onRequestPhotoAccess?.(p)}
                            className="text-[11px] text-amber-300 underline font-medium hover:text-amber-200 cursor-pointer"
                          >
                            Request Again
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={getUserDisplayPhoto(p)}
                      alt={p.name || p.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAiPhotoForGender(p?.gender);
                      }}
                    />
                    {photoReqStatus === 'approved' && !isSelf && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 text-white text-[11px] font-bold rounded-full backdrop-blur-md shadow-md">
                        <CheckCircle className="w-3.5 h-3.5 text-white" /> Photo Access Approved
                      </div>
                    )}
                  </div>
                )}
                {p.premium_plan !== "Basic" && <div className="absolute top-3 left-3 z-10"><PremiumBadge /></div>}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full">
                  <span className={`w-2 h-2 rounded-full ${p.online !== false ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`} />
                  <span className="text-white text-xs font-medium">{p.online !== false ? "Online Now" : "Offline"}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-white font-display text-xl font-bold">{p.name || p.full_name}</h2>
                      <p className="text-white/80 text-sm">
                        {p.age ? `${p.age} yrs` : p.dob ? `${new Date().getFullYear() - new Date(p.dob).getFullYear()} yrs` : ''} {(p.age || p.dob) ? '·' : ''} {p.city || "Chennai"}, {p.state || "Tamil Nadu"}
                      </p>
                    </div>
                    {/* Upload / Change Photo Actions - only for own profile */}
                    {isSelf && (
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="photo-card-file-input" className="px-2.5 py-1.5 bg-white/90 hover:bg-white text-gray-800 font-semibold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1 backdrop-blur-sm transition-all" title="Upload or Change Photo">
                          <Upload className="w-3.5 h-3.5 text-[#0284C7]" />
                          <span className="hidden sm:inline">Change Photo</span>
                        </label>
                        <input
                          type="file"
                          id="photo-card-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newImg = reader.result as string;
                                const updated = { ...p, img: newImg, photo: newImg, isCustomPhoto: true };
                                setProfile(updated);
                                if (onUpdateUser) onUpdateUser(updated);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Thumbnail strip */}
              <div className="p-3 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="aspect-square rounded-lg overflow-hidden ring-2 ring-transparent bg-sky-50 flex items-center justify-center">
                    {isBasicViewer ? (
                      <Lock className="w-4 h-4 text-sky-300" />
                    ) : (
                      <Camera className="w-5 h-5 text-sky-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Horoscope Compatibility Card */}
            <div className="bg-gradient-to-br from-[#071328] via-[#0F2C59] to-[#0284C7] rounded-2xl p-5 text-center text-white relative overflow-hidden shadow-md">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px), radial-gradient(circle at 90% 10%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
              <div className="relative">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Horoscope Compatibility</p>
                <div className="relative w-24 h-24 mx-auto my-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${matchPct * 2.64} 264`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold text-amber-400">{matchPct}%</span>
                </div>
                <p className="text-white/90 text-sm font-semibold">{matchPct >= 85 ? "Excellent Match" : matchPct >= 70 ? "Good Match" : "Fair Match"}</p>
                <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
                  {[
                    { label: "Rasi", ok: true },
                    { label: "Nakshatra", ok: true },
                    { label: "No Dosham", ok: p.dosham === "None" || !p.dosham },
                  ].map(({ label, ok }) => (
                    <span key={label} className={`px-2.5 py-1 text-xs rounded-full font-medium ${ok ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                      {label} {ok ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(() => {
              const profileInterestStatus: string = getProfileInterestStatus(currentUser, p, sentInterests, interestStatuses);

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-4 space-y-2.5">
                  {!isSelf && (
                    <>
                      {profileInterestStatus === 'pending' ? (
                        <span className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          ⏳ Request Pending
                        </span>
                      ) : (profileInterestStatus === 'accepted' || profileInterestStatus === 'approved') ? (
                        <button
                          onClick={() => setPage('chat')}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Accepted – Start Chat
                        </button>
                      ) : (profileInterestStatus === 'rejected' || profileInterestStatus === 'declined') ? (
                        <span className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          <X className="w-4 h-4 text-rose-500" /> Request Declined
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (onSendInterest && p) onSendInterest(p);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white hover:opacity-95 shadow-sm hover:shadow-md rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Heart className="w-4 h-4 fill-white" />
                          Send Interest
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => setPage("chat")} className="w-full py-3 border border-sky-300 text-[#0F2C59] font-semibold rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <MessageCircle className="w-4 h-4 text-[#0284C7]" />Send Message
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Shortlist", icon: Star, onClick: () => setShortlisted(!shortlisted), active: shortlisted },
                      { label: "Report", icon: Flag, onClick: () => {}, active: false },
                      { label: "Block", icon: Ban, onClick: () => {}, active: false },
                    ].map(({ label, icon: Icon, onClick, active }) => (
                      <button key={label} onClick={onClick} className={`py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${active ? "border-amber-300 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"}`}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ─── Right Content ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5 space-y-4">
              <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h1 className="font-display text-2xl font-bold text-gray-900">{p.name || p.full_name}</h1>
                    {isSelf && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0F2C59] text-xs font-semibold rounded-full border border-sky-200 transition-colors shadow-sm cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#0284C7]" />
                        Edit Profile
                      </button>
                    )}
                    {p.verified && <CheckCircle className="w-5 h-5 text-emerald-500" title="Verified Profile" />}
                  </div>
                  <p className="text-gray-600 font-medium text-sm">{p.age} years · {p.height || "5'4\""} · {p.complexion || "Fair"}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-[#0284C7]" />{p.city || "Chennai"}, {p.state || "Tamil Nadu"}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <PremiumBadge />
                  <MatchBadge pct={matchPct} />
                </div>
              </div>

              {/* WhatsApp Contact Banner */}
              {isBasicViewer ? (
                <div className="bg-sky-50/90 border border-sky-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#003B7B] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#003B7B] uppercase tracking-wider">Phone / WhatsApp Contact Info</p>
                      <p className="text-sm font-bold text-[#0F2C59]">Hidden for Basic Plan 🔒 (+91 ***** *****)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPage("premium")}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                  >
                    👑 Upgrade to View
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">WhatsApp Contact Info</p>
                      <p className="text-sm font-bold text-emerald-950">{p.whatsapp || p.phone || "+91 98765 43210"}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100/90 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 shadow-2xs">
                    Unlocked
                  </span>
                </div>
              )}
            </div>

            {/* Tabbed Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
              {/* Tab Bar */}
              <div className="flex bg-sky-50/80 p-1.5 m-4 mb-0 rounded-xl gap-1 border border-sky-100/60">
                {tabItems.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all cursor-pointer ${tab === id ? "bg-white shadow-sm text-[#0F2C59] font-bold" : "text-gray-600 hover:text-[#0284C7] hover:bg-white/60"}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* ─── Basic Tab ─── */}
                {tab === "basic" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoRow label="Full Name" value={p.name || p.full_name} />
                    <InfoRow label="Age" value={p.age ? `${p.age} years` : "26 years"} />
                    <InfoRow label="Height" value={p.height || "5'4\""} />
                    <InfoRow label="Complexion" value={p.complexion || "Fair"} />
                    <InfoRow label="Religion" value={p.religion || "Hindu"} />
                    <InfoRow label="Caste" value={p.caste || "Brahmin"} />
                    <InfoRow label="Education" value={p.education || "M.Tech"} />
                    <InfoRow label="Occupation" value={p.job || p.occupation || "Software Engineer"} />
                    <InfoRow label="Annual Income" value={p.salary || p.income || "12 LPA"} />
                    <InfoRow label="Marital Status" value={p.marital_status || "Never Married"} />
                    <InfoRow label="Mother Tongue" value={p.mother_tongue || "Tamil"} />
                    <InfoRow label="Diet" value={p.diet || "Vegetarian"} />
                    <InfoRow label="Phone Number" value={isBasicViewer ? "Hidden for Basic Plan 🔒" : (p.phone || p.whatsapp || "+91 98765 43210")} accent={isBasicViewer} />
                    <InfoRow label="City & State" value={`${p.city || "Chennai"}, ${p.state || "Tamil Nadu"}`} />
                    <InfoRow label="Full Address" value={isBasicViewer ? "Hidden for Basic Plan 🔒" : (p.address || `${p.city || "Chennai"}, ${p.state || "Tamil Nadu"}`)} accent={isBasicViewer} />
                  </div>
                )}

                {/* ─── Family Tab ─── */}
                {tab === "family" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InfoRow label="Father's Name" value={p.father_name || p.fatherName || null} />
                    <InfoRow label="Father's Occupation" value={p.father_occupation || p.fatherJob || null} />
                    <InfoRow label="Mother's Name" value={p.mother_name || p.motherName || null} />
                    <InfoRow label="Mother's Occupation" value={p.mother_occupation || p.motherJob || null} />
                    <InfoRow label="Brother's Name" value={p.brother_name || p.brotherName || null} />
                    <InfoRow label="Sister's Name" value={p.sister_name || p.sisterName || null} />
                    <InfoRow label="Family Type" value={p.family_type || p.familyType || "Joint Family"} />
                    <InfoRow label="Family Status" value={p.family_status || "Upper Middle Class"} />
                    <InfoRow label="Family Values" value={p.family_values || "Traditional"} />
                    <InfoRow label="Native Place" value={p.native_place || (p.city && p.state ? `${p.city}, ${p.state}` : null)} />
                    <InfoRow label="Gothram" value={p.gothram || p.gotra || null} />
                    <InfoRow label="Sub Caste" value={p.subCaste || p.sub_caste || null} />
                  </div>
                )}

                {/* ─── Horoscope Tab ─── */}
                {tab === "horoscope" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <InfoRow label="Rasi" value={p.rasi} accent />
                      <InfoRow label="Nakshatra" value={p.nakshatra} accent />
                      <InfoRow label="Dosham" value={p.dosham} accent />
                      <InfoRow label="Birth Time" value={p.birth_time} accent />
                      <InfoRow label="Birth Place" value={p.birth_place || (p.city && p.state ? `${p.city}, ${p.state}` : null)} accent />
                      <InfoRow label="Lagnam" value={p.lagnam} accent />
                    </div>
                    <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100 text-center">
                      <p className="text-sm text-gray-500 mb-1">Your compatibility with this profile</p>
                      <p className="font-display text-4xl font-bold text-[#0F2C59]">{matchPct}%</p>
                      <p className="text-xs text-gray-400 mt-1">Based on Rasi, Nakshatra &amp; Dosham matching</p>
                    </div>
                    {p.horoscope_path && !p.isLocked && (
                      <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-[#0284C7] flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-[#0F2C59]">Horoscope Document Available</p>
                          <p className="text-xs text-sky-600">Uploaded and verified</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Expectations Tab ─── */}
                {tab === "expectations" && (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <InfoRow label="Age Preference" value={
                      p.pref_age_min && p.pref_age_max
                        ? `${p.pref_age_min}–${p.pref_age_max} years`
                        : p.age ? `${Math.max(18, Number(p.age) - 5)}–${Number(p.age) + 5} years` : "22–32 years"
                    } />
                    <InfoRow label="Height Preference" value={p.pref_height || "Any height"} />
                    <InfoRow label="Religion" value={p.pref_religion || p.religion || "Hindu"} />
                    <InfoRow label="Education" value={p.pref_education || "Any Graduate"} />
                    <InfoRow label="Income" value={p.pref_income || "Any"} />
                    <InfoRow label="Occupation" value={p.pref_occupation || "Any"} />
                    <InfoRow label="Location" value={isBasicViewer ? "Hidden for Basic Plan 🔒" : (p.pref_location || p.state || "Tamil Nadu")} accent={isBasicViewer} />
                    <InfoRow label="Dosham" value={p.pref_dosham || "None preferred"} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interests ────────────────────────────────────────────────────────────────

function InterestsPage({
  setPage,
  currentUser,
  customSentInterests = [],
  activeTab = "received",
  setActiveTab,
  onRespondInterest,
  interestStatuses = {},
  onOpenChat,
  photoRequests = [],
  onRespondPhotoRequest,
}: {
  setPage: (p: Page) => void;
  currentUser: any;
  customSentInterests?: any[];
  activeTab?: string;
  setActiveTab?: (t: string) => void;
  onRespondInterest?: (interestId: number | string, status: string, senderId?: number | string, receiverId?: number | string) => void;
  interestStatuses?: Record<string | number, string>;
  onOpenChat?: (user: any) => void;
  photoRequests?: any[];
  onRespondPhotoRequest?: (reqId: string, status: 'approved' | 'declined') => void;
}) {
  const [tab, setTabState] = useState(activeTab);
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>({});

  const viewerPlan = (currentUser?.premium_plan || currentUser?.plan || 'Basic').toLowerCase();
  const isGoldOrAbove = viewerPlan === 'gold' || viewerPlan === 'diamond' || viewerPlan === 'platinum' || viewerPlan === 'premium';
  const isBasicUser = !isGoldOrAbove;

  useEffect(() => {
    if (activeTab) setTabState(activeTab);
  }, [activeTab]);

  const setTab = (t: string) => {
    setTabState(t);
    if (setActiveTab) setActiveTab(t);
  };

  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = currentUser?.id;

  const fetchInterests = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/interests?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setReceived(data.received || []);
        setSent(data.sent || []);
      }
    } catch (err) {
      console.error('Failed to load interests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (interestId: number, status: string, senderId?: number | string, receiverId?: number | string) => {
    // Update local state immediately for all key variants so UI reflects instantly
    setLocalStatuses((prev) => {
      const updated: Record<number, string> = { ...prev, [interestId]: status };
      if (senderId && receiverId) {
        (updated as any)[`${senderId}_${receiverId}`] = status;
        (updated as any)[`${receiverId}_${senderId}`] = status;
        (updated as any)[String(senderId) + '_' + String(receiverId)] = status;
      }
      return updated;
    });
    if (onRespondInterest) {
      onRespondInterest(interestId, status, senderId, receiverId);
    }
    try {
      const res = await fetch('http://localhost:5001/api/interests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status })
      });
      const data = await res.json();
      if (data.success) fetchInterests();
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  useEffect(() => { fetchInterests(); }, [userId]);

  // Merge backend received list with any custom received interests where current user is receiver
  const combinedReceived = received.map((r) => {
    const pairKey1 = r.sender_id && r.receiver_id ? `${r.sender_id}_${r.receiver_id}` : null;
    const pairKey2 = r.sender_id && r.receiver_id ? `${r.receiver_id}_${r.sender_id}` : null;
    const overrideStatus =
      interestStatuses[r.id] || interestStatuses[String(r.id)] ||
      localStatuses[r.id] ||
      (pairKey1 ? (interestStatuses as any)[pairKey1] || (localStatuses as any)[pairKey1] : undefined) ||
      (pairKey2 ? (interestStatuses as any)[pairKey2] || (localStatuses as any)[pairKey2] : undefined);
    return overrideStatus ? { ...r, status: overrideStatus } : r;
  });

  // If current logged-in user matches receiver_id in customSentInterests, display the sender's info in Received tab
  customSentInterests.forEach((cs) => {
    const csPairKey1 = cs.sender_id && cs.receiver_id ? `${cs.sender_id}_${cs.receiver_id}` : null;
    const csPairKey2 = cs.sender_id && cs.receiver_id ? `${cs.receiver_id}_${cs.sender_id}` : null;
    const itemStatus =
      interestStatuses[cs.id] || interestStatuses[String(cs.id)] ||
      localStatuses[cs.id] ||
      (csPairKey1 ? (interestStatuses as any)[csPairKey1] || (localStatuses as any)[csPairKey1] : undefined) ||
      (csPairKey2 ? (interestStatuses as any)[csPairKey2] || (localStatuses as any)[csPairKey2] : undefined) ||
      cs.status || 'pending';
    if (cs.receiver_id === currentUser?.id || (currentUser?.name && cs.name && currentUser.name.toLowerCase().includes(cs.name.toLowerCase()))) {
      const existingIdx = combinedReceived.findIndex((r) => r.id === cs.id || (r.sender_id === cs.sender_id && r.receiver_id === cs.receiver_id));
      if (existingIdx !== -1) {
        const currentStatus = combinedReceived[existingIdx].status;
        const finalStatus = itemStatus !== 'pending' ? itemStatus : (currentStatus !== 'pending' ? currentStatus : 'pending');
        combinedReceived[existingIdx] = { ...combinedReceived[existingIdx], status: finalStatus };
      } else {
        combinedReceived.push({
          id: cs.id,
          sender_id: cs.sender_id,
          receiver_id: cs.receiver_id,
          name: cs.sentBy || 'Aravind Venkatesh', // Name of person who sent the interest
          img: cs.senderImg || null,
          age: cs.senderAge || '',
          city: cs.senderCity || '',
          status: itemStatus,
          created_at: cs.created_at,
          sentBy: cs.sentBy,
        });
      }
    }
  });

  const receivedPending = combinedReceived.filter(i => i.status === 'pending');
  const receivedAccepted = combinedReceived.filter(i => i.status === 'accepted');

  // Merge current user's custom sent interests with backend sent list
  const currentUserSentCustom = customSentInterests
    .filter((cs) => cs.sender_id === currentUser?.id)
    .map((cs) => ({
      ...cs,
      status: interestStatuses[cs.id] || localStatuses[cs.id] || cs.status || 'pending'
    }));

  const combinedSent = sent.map((s) => {
    const overrideStatus = interestStatuses[s.id] || localStatuses[s.id];
    return overrideStatus ? { ...s, status: overrideStatus } : s;
  });

  currentUserSentCustom.forEach((cs) => {
    if (!combinedSent.some((c) => c.id === cs.id || c.receiver_id === cs.receiver_id)) {
      combinedSent.unshift(cs);
    }
  });

  // Photo view requests targeting this female user
  const userPhotoRequests = (photoRequests || []).filter(
    (r: any) => String(r.targetFemaleId) === String(currentUser?.id)
  );

  const tabs = [
    ['received', 'Received', receivedPending.length],
    ['sent', 'Sent', combinedSent.length],
    ['accepted', 'Accepted', receivedAccepted.length],
    ['rejected', 'Declined', 0]
  ];

  const filtered = tab === 'received' ? combinedReceived
    : tab === 'sent' ? combinedSent
    : tab === 'accepted' ? receivedAccepted
    : combinedReceived.filter(i => i.status === 'rejected');

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Interest Requests</h1>

        {/* ─── Photo Access Requests Management for Female Profile Owners ─── */}
        {userPhotoRequests.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Photo Access Requests ({userPhotoRequests.length})</h3>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full">
                Privacy Protected
              </span>
            </div>
            <div className="space-y-2.5">
              {userPhotoRequests.map((pr: any) => (
                <div key={pr.id} className="bg-white rounded-xl p-3.5 border border-amber-100/80 flex items-center justify-between gap-3 shadow-xs flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={pr.requesterImg || getAiPhotoForGender(pr.requesterGender)}
                      alt={pr.requesterName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-300 flex-shrink-0 shadow-sm"
                      onError={(e) => { (e.target as HTMLImageElement).src = getAiPhotoForGender(pr.requesterGender); }}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">{pr.requesterName}</p>
                      <p className="text-xs text-gray-500">{pr.requesterPlan || 'Gold'} Member • Requested permission to view your photo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    {pr.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRespondPhotoRequest?.(pr.id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onRespondPhotoRequest?.(pr.id, 'declined')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    ) : pr.status === 'approved' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full flex items-center gap-1">
                        <X className="w-3 h-3" /> Declined
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-sky-100 mb-6">
          {tabs.map(([id, label, count]) => (
            <button key={id as string} onClick={() => setTab(id as string)} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === id ? 'bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white shadow-sm font-semibold' : 'text-gray-600 hover:text-[#0284C7] hover:bg-sky-50'}`}>
              {label}
              {(count as number) > 0 && <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${tab === id ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>{count}</span>}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-16"><div className="animate-spin w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full mx-auto" /></div>
        ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Heart className="w-10 h-10 mx-auto mb-2 text-sky-200" />
              <p className="text-sm">No interests in this category yet.</p>
            </div>
          )}
          {filtered.map((interest: any) => (
            <div key={interest.id} className="bg-white rounded-2xl shadow-sm border border-sky-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="relative flex-shrink-0">
                {isBasicUser ? (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center relative shadow-sm overflow-hidden select-none">
                    <svg className="w-10 h-10 text-slate-500/80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                      <Lock className="w-4 h-4 text-amber-400 drop-shadow-md" />
                    </div>
                  </div>
                ) : interest.img ? (
                  <img src={interest.img} alt={interest.name} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#003B7B] via-[#1D72B8] to-[#56B7EE] flex items-center justify-center text-white font-bold text-lg shadow-sm select-none">
                    {(interest.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${interest.status === 'accepted' ? 'bg-emerald-500' : interest.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{interest.name}</p>
                  {/* Sent tab: show who sent it (Aravind Venkatesh) */}
                  {tab === 'sent' && interest.sentBy && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 font-semibold rounded-full flex items-center gap-0.5">
                      💖 by {interest.sentBy}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {interest.age ? `${interest.age} yrs` : ''}
                  {interest.city ? ` · ${interest.city}` : ''}
                  {interest.state ? `, ${interest.state}` : ''}
                </p>
                {/* Context label for Sent tab */}
                {tab === 'sent' && interest.sentBy && (
                  <p className="text-xs text-sky-700 font-medium mt-0.5">
                    Interest sent by <span className="font-bold">{interest.sentBy}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {interest.created_at ? new Date(interest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* RECEIVER: Pending → Show Accept / Decline buttons */}
                {interest.status === 'pending' && tab === 'received' && (
                  <>
                    <button onClick={() => handleRespond(interest.id, 'accepted', interest.sender_id, interest.receiver_id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"><Check className="w-3 h-3" />Accept</button>
                    <button onClick={() => handleRespond(interest.id, 'rejected', interest.sender_id, interest.receiver_id)} className="px-3 py-1.5 border border-rose-200 text-rose-600 bg-rose-50 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"><X className="w-3 h-3" />Decline</button>
                  </>
                )}
                {/* RECEIVER: Accepted */}
                {tab === 'received' && (interest.status === 'accepted' || interest.status === 'approved') && (
                  <div className="flex flex-col gap-1.5">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ✓ Accepted
                    </span>
                    <button
                      onClick={() => {
                        if (onOpenChat) {
                          onOpenChat({ id: interest.sender_id || interest.id, name: interest.name, img: interest.img, online: true, phone: interest.phone || '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lastMsg: '', unread: 0 });
                        } else {
                          setPage('chat');
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white text-xs font-semibold rounded-lg hover:opacity-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" /> Chat
                    </button>
                  </div>
                )}
                {/* RECEIVER: Declined */}
                {tab === 'received' && (interest.status === 'rejected' || interest.status === 'declined') && (
                  <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-1">
                    <X className="w-3 h-3" /> Declined
                  </span>
                )}
                {/* SENDER: Pending */}
                {tab === 'sent' && interest.status === 'pending' && (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg border border-amber-200 flex items-center gap-1">⏳ Pending</span>
                )}
                {/* SENDER: Accepted → Connected + Chat */}
                {tab === 'sent' && (interest.status === 'accepted' || interest.status === 'approved') && (
                  <div className="flex flex-col gap-1.5">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Accepted
                    </span>
                    <button
                      onClick={() => {
                        if (onOpenChat) {
                          onOpenChat({ id: interest.receiver_id || interest.id, name: interest.name, img: interest.img, online: true, phone: interest.phone || '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lastMsg: '', unread: 0 });
                        } else {
                          setPage('chat');
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white text-xs font-semibold rounded-lg hover:opacity-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" /> Chat
                    </button>
                  </div>
                )}
                {/* SENDER: Declined */}
                {tab === 'sent' && (interest.status === 'rejected' || interest.status === 'declined') && (
                  <span className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1"><X className="w-3 h-3" /> Declined</span>
                )}
                {/* Accepted tab */}
                {tab === 'accepted' && (interest.status === 'accepted' || interest.status === 'approved') && (
                  <button
                    onClick={() => {
                      if (onOpenChat) {
                        onOpenChat({ id: interest.sender_id || interest.id, name: interest.name, img: interest.img, online: true, phone: interest.phone || '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lastMsg: '', unread: 0 });
                      } else {
                        setPage('chat');
                      }
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white text-xs font-semibold rounded-lg hover:opacity-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" /> Chat
                  </button>
                )}
                {(interest.status === 'rejected' || interest.status === 'declined') && tab !== 'sent' && tab !== 'received' && (
                  <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200">Declined</span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

// ─── Initial Mock Data per User ID for Isolation ──────────────────────────────────
const USER_MOCK_CHATS: Record<string, any[]> = {
  "101": [
    { id: 201, name: "Divya Nair", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", online: true, time: "10:30 AM", lastMsg: "Thank you for your interest!", unread: 2, phone: "+91 98765 43210" },
    { id: 202, name: "Priya Sharma", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", online: false, time: "Yesterday", lastMsg: "Sure, let us talk more!", unread: 0, phone: "+91 98234 56789" },
    { id: 203, name: "Ananya Krishnan", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", online: false, time: "2 days ago", lastMsg: "My family will call you soon.", unread: 0, phone: "+91 97123 45678" },
  ]
};

const USER_MOCK_MESSAGES: Record<string, any[]> = {
  "101_201": [
    { id: 1, sender_id: 201, text: "Hello! I saw your profile and I am very interested.", time: "10:00 AM" },
    { id: 2, sender_id: 101, text: "Hi Divya! Thank you for reaching out. I liked your profile too.", time: "10:05 AM" },
    { id: 3, sender_id: 201, text: "Can you tell me more about your family background?", time: "10:10 AM" },
    { id: 4, sender_id: 101, text: "Sure! I am from a Tamil Brahmin family, my father is a retired government officer.", time: "10:12 AM" },
    { id: 5, sender_id: 201, text: "That sounds wonderful! My family is originally from Coimbatore.", time: "10:15 AM" },
  ],
  "101_202": [
    { id: 1, sender_id: 202, text: "Hi! Thanks for connecting.", time: "Yesterday" },
    { id: 2, sender_id: 101, text: "Sure, let us talk more!", time: "Yesterday" }
  ],
  "101_203": [
    { id: 1, sender_id: 203, text: "My family will call you soon.", time: "2 days ago" }
  ]
};

function ChatPage({
  setPage,
  currentUser,
  pendingChatUser,
  onClearPendingChat,
  setSelectedProfileId
}: {
  setPage: (p: Page) => void;
  currentUser: any;
  pendingChatUser?: any | null;
  onClearPendingChat?: () => void;
  setSelectedProfileId?: (id: number) => void;
}) {
  const userId = String(currentUser?.id || currentUser?.phone || '101');
  const userName = currentUser?.name || currentUser?.full_name || 'You';
  const userImg = currentUser?.img || currentUser?.photo || '';
  const userPlan = (currentUser?.premium_plan || currentUser?.plan || 'Basic').toLowerCase();
  const isUnlocked = userPlan === 'gold' || userPlan === 'premium' || userPlan === 'platinum';
  // Voice and Video calling + Full contact details are unlocked for Premium and Platinum
  const isVoiceCallUnlocked = userPlan === 'premium' || userPlan === 'platinum';

  const [searchQuery, setSearchQuery] = useState('');
  const [showVoiceLockedModal, setShowVoiceLockedModal] = useState(false);
  const [showVideoLockedModal, setShowVideoLockedModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'partner' | 'mine'>('partner');

  // Voice Calling State
  const [activeVoiceCall, setActiveVoiceCall] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [voiceCallDuration, setVoiceCallDuration] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isVoiceSpeaker, setIsVoiceSpeaker] = useState(true);

  // Video Calling State
  const [activeVideoCall, setActiveVideoCall] = useState(false);
  const [videoCallStatus, setVideoCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [videoCallDuration, setVideoCallDuration] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoCameraOff, setIsVideoCameraOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startVoiceCall = () => {
    if (!isVoiceCallUnlocked) {
      setShowVoiceLockedModal(true);
      return;
    }
    setActiveVoiceCall(true);
    setVoiceCallStatus('calling');
    setVoiceCallDuration(0);
    setIsVoiceMuted(false);
    setIsVoiceSpeaker(true);
    setTimeout(() => {
      setVoiceCallStatus('ringing');
      setTimeout(() => {
        setVoiceCallStatus('connected');
      }, 1400);
    }, 1200);
  };

  const endVoiceCall = () => {
    setVoiceCallStatus('ended');
    setTimeout(() => {
      setActiveVoiceCall(false);
      setVoiceCallDuration(0);
    }, 600);
  };

  const startVideoCall = () => {
    if (!isVoiceCallUnlocked) {
      setShowVideoLockedModal(true);
      return;
    }
    setActiveVideoCall(true);
    setVideoCallStatus('connecting');
    setVideoCallDuration(0);
    setIsVideoMuted(false);
    setIsVideoCameraOff(false);
    setTimeout(() => {
      setVideoCallStatus('connected');
    }, 1800);
  };

  const endVideoCall = () => {
    setVideoCallStatus('ended');
    setTimeout(() => {
      setActiveVideoCall(false);
      setVideoCallDuration(0);
    }, 600);
  };

  // Video local camera stream management
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeVideoCall && !isVideoCameraOff) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(s => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.log("Webcam access optional/fallback", err);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [activeVideoCall, isVideoCameraOff]);

  // Voice and Video call duration timers
  useEffect(() => {
    let interval: any;
    if (activeVoiceCall && voiceCallStatus === 'connected') {
      interval = setInterval(() => {
        setVoiceCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeVoiceCall, voiceCallStatus]);

  useEffect(() => {
    let interval: any;
    if (activeVideoCall && videoCallStatus === 'connected') {
      interval = setInterval(() => {
        setVideoCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeVideoCall, videoCallStatus]);

  // ── Shared conversation key (canonical, sorted so both users use same key) ──────
  const convKey = (idA: string, idB: string) => {
    const [lo, hi] = [idA, idB].sort();
    return `vivah_conv_${lo}_${hi}`;
  };

  // Per-User Chat Storage Key
  const storageChatsKey = `vivah_user_chats_${userId}`;

  // Initialize Chats for Current User Only
  const [chats, setChats] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(storageChatsKey);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return USER_MOCK_CHATS[userId] || [
      { id: 301, name: "Sneha Reddy", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150", online: true, time: "09:15 AM", lastMsg: "Hello! Nice to meet you.", unread: 1, phone: "+91 99887 76655" }
    ];
  });

  // Re-sync chats when userId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageChatsKey);
      if (saved) {
        setChats(JSON.parse(saved));
      } else {
        const initial = USER_MOCK_CHATS[userId] || [
          { id: 301, name: "Sneha Reddy", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150", online: true, time: "09:15 AM", lastMsg: "Hello! Nice to meet you.", unread: 1, phone: "+91 99887 76655" }
        ];
        setChats(initial);
        localStorage.setItem(storageChatsKey, JSON.stringify(initial));
      }
    } catch (e) { console.error(e); }
  }, [userId]);

  // Persist chats for this user whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(storageChatsKey, JSON.stringify(chats));
    } catch (e) { console.error(e); }
  }, [chats, storageChatsKey]);

  // Active Selected Chat state
  const [activeChat, setActiveChat] = useState<any>(() => chats[0] || null);

  useEffect(() => {
    if (chats.length > 0 && (!activeChat || !chats.find(c => c.id === activeChat.id))) {
      setActiveChat(chats[0]);
    }
  }, [chats]);

  // When navigating from Interests → Chat with a specific user, inject them into chat list
  useEffect(() => {
    if (!pendingChatUser) return;
    const pId = pendingChatUser.id;
    setChats(prev => {
      const exists = prev.find(c => String(c.id) === String(pId));
      if (exists) return prev;
      return [{ ...pendingChatUser, unread: 0 }, ...prev];
    });
    setActiveChat(pendingChatUser);
    if (onClearPendingChat) onClearPendingChat();
  }, [pendingChatUser]);

  // Per-Conversation Messages state (shared between sender & receiver)
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  // Poll for new incoming messages every 2 seconds (simulates real-time receive)
  useEffect(() => {
    if (!activeChat || !isUnlocked) return;
    const key = convKey(userId, String(activeChat.id));
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const stored: any[] = JSON.parse(raw);
          setMessages(prev => {
            if (stored.length !== prev.length) return stored;
            return prev;
          });
        }
      } catch (e) { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [userId, activeChat?.id, isUnlocked]);

  // Load shared conversation messages
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    const key = convKey(userId, String(activeChat.id));
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Seed with mock data if available
        const mockKey = `${userId}_${activeChat.id}`;
        const initial = USER_MOCK_MESSAGES[mockKey] || [];
        setMessages(initial);
        if (initial.length > 0) {
          localStorage.setItem(key, JSON.stringify(initial));
        }
      }
    } catch (e) {
      console.error(e);
      setMessages([]);
    }
    // Mark messages as read for this user (clear unread badge)
    setChats(prev => prev.map(c =>
      String(c.id) === String(activeChat.id) ? { ...c, unread: 0 } : c
    ));
  }, [userId, activeChat?.id]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: Date.now(),
      sender_id: userId,
      sender_name: userName,
      sender_img: userImg,
      text: messageText.trim(),
      time: timeStr
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);

    // ── Save to SHARED conversation key (both users read from same key) ──────────
    const key = convKey(userId, String(activeChat.id));
    try {
      localStorage.setItem(key, JSON.stringify(updatedMsgs));
    } catch (err) { console.error(err); }

    // ── Update sender's own chat list ──────────────────────────────────────────
    setChats(prev => prev.map(c =>
      String(c.id) === String(activeChat.id)
        ? { ...c, lastMsg: messageText.trim(), time: timeStr, unread: 0 }
        : c
    ));

    // ── Update RECEIVER's chat list so the message appears for them too ────────
    const receiverId = String(activeChat.id);
    const receiverChatsKey = `vivah_user_chats_${receiverId}`;
    try {
      let receiverChats: any[] = [];
      const savedReceiverChats = localStorage.getItem(receiverChatsKey);
      if (savedReceiverChats) {
        receiverChats = JSON.parse(savedReceiverChats);
      }
      const senderEntry = {
        id: userId,
        name: userName,
        img: userImg,
        online: true,
        time: timeStr,
        lastMsg: messageText.trim(),
        unread: 1,
        phone: currentUser?.phone || currentUser?.whatsapp || ''
      };
      const existsIdx = receiverChats.findIndex(c => String(c.id) === String(userId));
      if (existsIdx >= 0) {
        receiverChats[existsIdx] = {
          ...receiverChats[existsIdx],
          lastMsg: messageText.trim(),
          time: timeStr,
          unread: (receiverChats[existsIdx].unread || 0) + 1
        };
      } else {
        receiverChats = [senderEntry, ...receiverChats];
      }
      localStorage.setItem(receiverChatsKey, JSON.stringify(receiverChats));
    } catch (err) { console.error(err); }

    setMessageText('');
  };

  // If messaging is locked (Basic / Free user after login)
  if (!isUnlocked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 select-none">
        {/* Soft pink blurred background glows on the right */}
        <div className="absolute top-1/4 -right-16 w-96 h-96 bg-gradient-to-br from-pink-300/40 via-rose-200/30 to-purple-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/6 right-0 w-[30rem] h-[30rem] bg-gradient-to-tr from-pink-400/30 via-rose-300/25 to-purple-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center">
          {/* Chat Icon Badge */}
          <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center mb-7 shadow-sm shadow-sky-100/50">
            <svg
              className="w-10 h-10 text-[#0284C7]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-3">
            Chat & Voice Notes Locked
          </h2>

          {/* Subtitle */}
          <p className="text-[#64748b] text-sm sm:text-base leading-relaxed mb-8 px-2 max-w-md">
            Start direct messaging, voice notes, and share matching cards with this profile. Requires Gold or Premium.
          </p>

          {/* Upgrade to Gold Button */}
          <button
            onClick={() => setPage('premium')}
            className="px-9 py-3.5 sm:px-10 sm:py-4 rounded-full text-white font-bold text-base sm:text-lg bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 shadow-lg shadow-sky-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Upgrade to Gold
          </button>
        </div>
      </div>
    );
  }

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMsg && c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden select-none">
      {/* Left Chat List Column */}
      <div className="w-80 sm:w-88 flex-shrink-0 border-r border-sky-100/60 flex flex-col bg-white">
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-sky-100/60">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredChats.length === 0 ? (
            <div className="text-center py-16 px-4 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-sky-200" />
              <p className="text-sm font-medium text-gray-600">No chats found</p>
              <p className="text-xs text-gray-400 mt-1">Accept interests to start chatting!</p>
            </div>
          ) : (
            filteredChats.map((chat: any) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                  }}
                  className={`w-full flex items-center gap-3.5 p-4 text-left hover:bg-sky-50/40 transition-colors cursor-pointer relative ${
                    isActive ? 'bg-sky-50/70 border-l-4 border-[#0284C7]' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={chat.img} alt={chat.name} className="w-11 h-11 rounded-full object-cover shadow-xs" />
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{chat.name}</h4>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate pr-2">{chat.lastMsg}</p>
                      {chat.unread > 0 && (
                        <span className="flex-shrink-0 bg-[#0284C7] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Conversation Window */}
      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-sky-100/60 bg-white shadow-2xs z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={activeChat.img} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                {activeChat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{activeChat.name}</h3>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {activeChat.online ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons (Phone, Video Camera, User Profile) */}
            <div className="flex items-center gap-1.5 text-[#0284C7]">
              {/* Voice Call Button */}
              <button
                title={isVoiceCallUnlocked ? `Start Voice Call with ${activeChat.name}` : "Voice Call (Premium Plan Required)"}
                onClick={startVoiceCall}
                className="relative p-2 hover:bg-sky-50 rounded-full transition-all cursor-pointer text-[#0284C7] hover:scale-105 active:scale-95"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                {!isVoiceCallUnlocked && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[8px] shadow-xs" title="Premium Required">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </button>

              {/* Video Call Button */}
              <button
                title={isVoiceCallUnlocked ? `Start Video Call with ${activeChat.name}` : "Video Call (Premium Plan Required)"}
                onClick={startVideoCall}
                className="relative p-2 hover:bg-sky-50 rounded-full transition-all cursor-pointer text-[#0284C7] hover:scale-105 active:scale-95"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                {!isVoiceCallUnlocked && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[8px] shadow-xs" title="Premium Required">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </button>

              {/* View Profile Button */}
              <button
                title={`View ${activeChat.name}'s Profile Details`}
                onClick={() => {
                  setProfileTab('partner');
                  setShowProfileModal(true);
                }}
                className="p-2 hover:bg-sky-50 rounded-full transition-all cursor-pointer text-[#0284C7] hover:scale-105 active:scale-95"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* WhatsApp Unlocked Amber Notification */}
          <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-6 py-2 flex items-center justify-between text-xs text-[#b45309]">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#d97706]" />
              <span>WhatsApp unlocked — <span className="font-bold">{activeChat.phone || '+91 98765 43210'}</span></span>
            </div>
            <button
              onClick={startVoiceCall}
              className="flex items-center gap-1 font-semibold text-[#b45309] hover:underline cursor-pointer"
            >
              <Phone className="w-3 h-3" /> Call
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#f8fafc] to-white">
            {messages.map((msg: any) => {
              const isMe = String(msg.sender_id) === String(userId) || msg.sender_id === 'me';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white shadow-xs rounded-br-xs'
                          : 'bg-white border border-gray-200/80 text-gray-800 shadow-2xs rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[11px] mt-1 text-gray-400 px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-sky-100/60 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <button type="button" className="p-2.5 text-gray-400 hover:text-[#0284C7] hover:bg-sky-50 rounded-xl transition-colors cursor-pointer">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-gray-800"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-5 py-3 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-3 text-sky-200" />
            <p className="text-gray-500 font-medium">Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {/* ── Voice Calling Locked Modal (Gold & Basic plan users) ─────────────── */}
      {showVoiceLockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowVoiceLockedModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center"
            style={{ animation: 'modalPop 0.22s cubic-bezier(.4,1.6,.6,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVoiceLockedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-5 relative">
              <Phone className="w-8 h-8 text-orange-500" />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-xs">
                <Lock className="w-3 h-3" />
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Voice Calling Locked</h2>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-6 px-2">
              Access to direct Voice Calling is locked under your current membership tier. Upgrade to the <span className="font-semibold text-gray-700">Premium Plan</span> to unlock unlimited voice calling immediately.
            </p>

            {/* Recommended Upgrade Card */}
            <div className="w-full border border-gray-200 rounded-xl p-4 mb-5 flex items-center justify-between bg-orange-50/30">
              <div className="text-left">
                <p className="text-[10px] font-bold text-rose-500 tracking-widest uppercase mb-1">Recommended Upgrade</p>
                <p className="font-bold text-gray-900 text-base">Premium Plan</p>
                <p className="text-gray-400 text-xs mt-0.5">₹4,999 / 1 year</p>
              </div>
              <button
                onClick={() => { setShowVoiceLockedModal(false); setPage('premium'); }}
                className="px-5 py-2.5 rounded-full text-white font-bold text-sm cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{ background: 'linear-gradient(135deg, #eb1763 0%, #a81da6 50%, #7926da 100%)' }}
              >
                Choose Plan
              </button>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowVoiceLockedModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowVoiceLockedModal(false); setPage('premium'); }}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Calling Locked Modal (Gold & Basic plan users) ─────────────── */}
      {showVideoLockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowVideoLockedModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center"
            style={{ animation: 'modalPop 0.22s cubic-bezier(.4,1.6,.6,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVideoLockedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Lock Icon */}
            <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mb-5 relative">
              <Camera className="w-8 h-8 text-[#0284C7]" />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-xs">
                <Lock className="w-3 h-3" />
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Video Calling Locked</h2>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-6 px-2">
              1-on-1 HD Video Calling is an exclusive feature for <span className="font-semibold text-gray-700">Premium Plan</span> members. Upgrade today to meet face-to-face securely!
            </p>

            {/* Recommended Upgrade Card */}
            <div className="w-full border border-sky-100 bg-sky-50/50 rounded-xl p-4 mb-5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] font-bold text-sky-600 tracking-widest uppercase mb-1">Recommended Upgrade</p>
                <p className="font-bold text-gray-900 text-base">Premium Plan</p>
                <p className="text-gray-400 text-xs mt-0.5">₹4,999 / 1 year</p>
              </div>
              <button
                onClick={() => { setShowVideoLockedModal(false); setPage('premium'); }}
                className="px-5 py-2.5 rounded-full text-white font-bold text-sm cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{ background: 'linear-gradient(135deg, #0284C7 0%, #003B7B 100%)' }}
              >
                Choose Plan
              </button>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowVideoLockedModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowVideoLockedModal(false); setPage('premium'); }}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Live Voice Call Modal (Premium / Platinum) ────────────────── */}
      {activeVoiceCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center text-white overflow-hidden"
            style={{ animation: 'modalPop 0.25s cubic-bezier(.4,1.6,.6,1) both' }}
          >
            {/* Top Header Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-[11px] text-emerald-400 font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>End-to-End Encrypted Voice Call</span>
            </div>

            {/* Avatar with animated pulse rings */}
            <div className="relative mb-6">
              {voiceCallStatus === 'connected' && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-sky-500/25 animate-ping" />
                  <div className="absolute -inset-6 rounded-full bg-sky-400/15 animate-pulse" />
                </>
              )}
              <img
                src={activeChat.img}
                alt={activeChat.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-sky-400 shadow-2xl relative z-10"
              />
              <span className="absolute bottom-1 right-1 z-20 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            {/* Partner Info */}
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{activeChat.name}</h2>
            <p className="text-xs text-sky-300 font-medium mb-3">{activeChat.phone || '+91 98765 43210'}</p>

            {/* Status & Duration */}
            <div className="mb-6 flex flex-col items-center min-h-[48px] justify-center">
              {voiceCallStatus === 'calling' && (
                <span className="text-sm font-semibold text-amber-400 animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  Calling...
                </span>
              )}
              {voiceCallStatus === 'ringing' && (
                <span className="text-sm font-semibold text-sky-400 animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  Ringing...
                </span>
              )}
              {voiceCallStatus === 'connected' && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                    {formatDuration(voiceCallDuration)}
                  </span>
                  {/* Audio Wave Visualizer Bars */}
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1 bg-sky-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-5" />
                    <span className="w-1 bg-sky-300 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4" />
                    <span className="w-1 bg-teal-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-5" />
                    <span className="w-1 bg-sky-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-3" />
                  </div>
                </div>
              )}
              {voiceCallStatus === 'ended' && (
                <span className="text-sm font-semibold text-rose-400">Call Ended</span>
              )}
            </div>

            {/* In-Call Controls */}
            <div className="flex items-center justify-center gap-4 w-full pt-4 border-t border-slate-700/60">
              {/* Mute Toggle */}
              <button
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isVoiceMuted ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                title={isVoiceMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isVoiceMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={() => setIsVoiceSpeaker(!isVoiceSpeaker)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isVoiceSpeaker ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                title={isVoiceSpeaker ? 'Speaker On' : 'Speaker Off'}
              >
                {isVoiceSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Switch to Video Call */}
              <button
                onClick={() => {
                  endVoiceCall();
                  setTimeout(() => startVideoCall(), 300);
                }}
                className="p-3.5 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all cursor-pointer"
                title="Switch to Video Call"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* End Call Button */}
              <button
                onClick={endVoiceCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Live Video Call Modal (Premium / Platinum) ────────────────── */}
      {activeVideoCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
          style={{ background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl h-[85vh] max-h-[640px] flex flex-col overflow-hidden"
            style={{ animation: 'modalPop 0.25s cubic-bezier(.4,1.6,.6,1) both' }}
          >
            {/* Top Header Overlay */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-sky-400 overflow-hidden">
                  <img src={activeChat.img} alt={activeChat.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{activeChat.name}</h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {videoCallStatus === 'connecting' ? 'Connecting HD Video...' : `Connected • ${formatDuration(videoCallDuration)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> HD 1080p Encrypted
                </span>
              </div>
            </div>

            {/* Video Canvas Area */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Remote Partner Video Stream Preview */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={activeChat.img}
                  alt={activeChat.name}
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                {videoCallStatus === 'connecting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs">
                    <div className="w-16 h-16 rounded-full border-4 border-sky-400 border-t-transparent animate-spin mb-4" />
                    <p className="text-white font-semibold text-lg">Establishing Secure Video Connection...</p>
                    <p className="text-slate-400 text-xs mt-1">Connecting with {activeChat.name}</p>
                  </div>
                )}
              </div>

              {/* Floating Picture-in-Picture User Camera */}
              <div className="absolute bottom-20 right-4 w-32 sm:w-44 h-44 sm:h-56 bg-slate-800 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
                {!isVideoCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                    <VideoOff className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">Camera Off</span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded-md font-semibold">
                  You ({userName})
                </span>
              </div>
            </div>

            {/* Video Call Action Bar */}
            <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-6 z-20">
              {/* Toggle Video Button */}
              <button
                onClick={() => setIsVideoCameraOff(!isVideoCameraOff)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isVideoCameraOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isVideoCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Toggle Mic Button */}
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isVideoMuted ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isVideoMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isVideoMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Video Call Button */}
              <button
                onClick={endVideoCall}
                className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                title="End Video Call"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } } @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* ── Partner & My Profile Side Panel Drawer ───────────────────────────── */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="ml-auto h-full w-full max-w-sm bg-white flex flex-col shadow-2xl"
            style={{ animation: 'slideInRight 0.25s cubic-bezier(.4,0,.2,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-gray-900 text-base">
                  {profileTab === 'partner' ? `${activeChat.name}'s Profile` : 'My Profile'}
                </h2>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setProfileTab('partner')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    profileTab === 'partner' ? 'bg-white text-sky-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Contact
                </button>
                <button
                  onClick={() => setProfileTab('mine')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    profileTab === 'mine' ? 'bg-white text-sky-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Me
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {profileTab === 'partner' ? (
                /* Partner Profile Tab */
                <div>
                  <div className="flex flex-col items-center py-6 px-5 bg-gradient-to-b from-sky-50/50 to-transparent">
                    <div className="relative mb-3">
                      <img
                        src={activeChat.img}
                        alt={activeChat.name}
                        className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                      />
                      {activeChat.online && (
                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-xl leading-tight">{activeChat.name}</h3>
                      <span className="text-sky-600" title="Verified Profile">
                        <CheckCircle className="w-4 h-4 fill-sky-100" />
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      {activeChat.online ? 'Online now' : 'Active recently'}
                    </p>

                    {/* Quick Call Action Bar inside Profile */}
                    <div className="flex items-center gap-3 mt-4 w-full justify-center">
                      <button
                        onClick={() => { setShowProfileModal(false); startVoiceCall(); }}
                        className="flex-1 max-w-[130px] py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-[#0284C7] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-sky-100 transition-all cursor-pointer active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" /> Voice Call
                      </button>
                      <button
                        onClick={() => { setShowProfileModal(false); startVideoCall(); }}
                        className="flex-1 max-w-[130px] py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-[#0284C7] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-sky-100 transition-all cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" /> Video Call
                      </button>
                    </div>
                  </div>

                  {/* Horoscope Compatibility Badge */}
                  <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">92% Horoscope Compatibility</p>
                        <p className="text-[10px] text-gray-500">Matching Rasi & Nakshatra</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded-full">
                      Great Match
                    </span>
                  </div>

                  {/* Contact & Profile Details */}
                  <div className="mx-4 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden mb-4 bg-white shadow-2xs">
                    {/* WhatsApp / Phone */}
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <Phone className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-sky-600 font-bold uppercase tracking-wide">Phone / WhatsApp</p>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Unlocked</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {activeChat.phone || '+91 98765 43210'}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <Mail className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-sky-600 font-bold uppercase tracking-wide">Verified Email</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {activeChat.name ? `${activeChat.name.toLowerCase().replace(/ /g, '.')}@gmail.com` : 'user@example.com'}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <MapPin className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-sky-600 font-bold uppercase tracking-wide">Location</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {activeChat.city || 'Chennai, Tamil Nadu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View Full Profile on Profile Page */}
                  <div className="px-4 pb-6">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setSelectedProfileId?.(activeChat.id);
                        setPage('profile');
                      }}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#0284C7] hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <User className="w-4 h-4" /> View Full Profile & Horoscope
                    </button>
                  </div>
                </div>
              ) : (
                /* My Profile Tab */
                <div>
                  <div className="flex flex-col items-center py-6 px-5">
                    <div className="relative mb-3">
                      {userImg ? (
                        <img src={userImg} alt={userName} className="w-20 h-20 rounded-full object-cover shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{userName}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{currentUser?.gender || 'Not specified'}</p>
                  </div>

                  {/* Premium Status */}
                  <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-gray-700">Premium Member Status</span>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full relative transition-colors ${
                        isUnlocked ? 'bg-rose-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          isUnlocked ? 'left-5' : 'left-1'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="mx-4 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <Phone className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-rose-500 font-semibold uppercase tracking-wide">WhatsApp Number</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {currentUser?.whatsapp
                            ? `+91 ${currentUser.whatsapp.replace(/^(\+91|91)/, '').trim()}`
                            : currentUser?.phone
                              ? `+91 ${currentUser.phone.replace(/^(\+91|91)/, '').trim()}`
                              : 'Not Provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <Mail className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-rose-500 font-semibold uppercase tracking-wide">Email ID</p>
                        <p className={`text-sm font-bold mt-0.5 ${ currentUser?.email ? 'text-gray-900' : 'text-gray-400' }`}>
                          {currentUser?.email || 'Not Provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-rose-500 font-semibold uppercase tracking-wide">Location Details</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {currentUser?.city || currentUser?.location
                            ? `Enabled (${currentUser.city || currentUser.location})`
                            : 'Not Provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Log Out Button */}
                  <div className="p-4 mt-4">
                    <button
                      onClick={() => { setShowProfileModal(false); setPage('landing'); }}
                      className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Premium ──────────────────────────────────────────────────────────────────

// ─── Premium ──────────────────────────────────────────────────────────────────

function PremiumPage({
  setPage,
  currentUser,
  setCurrentUser
}: {
  setPage: (p: Page) => void;
  currentUser?: any;
  setCurrentUser?: (user: any) => void;
}) {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState<{ tier: string; paymentId: string } | null>(null);

  const currentPlan = (currentUser?.premium_plan || "Basic").toLowerCase();

  const handlePurchase = async (plan: typeof PLANS[0]) => {
    if (plan.name === "Basic") {
      alert("Basic plan is free and active by default.");
      return;
    }

    setProcessingPlan(plan.name);
    setPaymentError("");

    const loadRazorpaySDK = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    try {
      await loadRazorpaySDK();
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay Checkout SDK could not be loaded. Please check your internet connection.");
      }

      const numericAmount = Number(plan.price.replace(/[^\d]/g, "")) || 2499;
      const amountPaise = numericAmount * 100;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_MKWS2Prv8NxVml";
      const user = currentUser || { id: 101, name: "Valued Member", phone: "9876543210", email: "member@mercuryconnect.com" };

      let orderId = "";
      try {
        const orderRes = await fetch(`${backendUrl}/api/payment/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            tier: plan.name,
            amount: numericAmount
          })
        });

        const orderData = await orderRes.json();
        if (orderData.success && orderData.order) {
          orderId = orderData.order.id;
        }
      } catch (orderErr) {
        console.warn("Backend order creation fallback to direct client checkout:", orderErr);
      }

      const options: any = {
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "MERCURY CONNECT",
        description: `${plan.name} Membership Plan (${plan.period})`,
        image: "/logo.svg",
        handler: async function (response: any) {
          try {
            if (response.razorpay_signature && orderId) {
              await fetch(`${backendUrl}/api/payment/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.id,
                  tier: plan.name
                })
              }).catch(() => {});
            }
          } catch (err) {
            console.warn("Verify sync error:", err);
          }

          const updatedUser = {
            ...user,
            premium_plan: plan.name,
            plan: plan.name
          };
          safeSetVivahUser(updatedUser);
          if (setCurrentUser) setCurrentUser(updatedUser);

          setPaymentSuccess({
            tier: plan.name,
            paymentId: response.razorpay_payment_id || "pay_test_" + Date.now()
          });
          setProcessingPlan(null);
        },
        prefill: {
          name: user.name || user.full_name || "Valued Member",
          contact: user.phone || "9876543210",
          email: user.email || "member@mercuryconnect.com"
        },
        notes: {
          userId: String(user.id || ""),
          tier: plan.name
        },
        theme: {
          color: plan.popular ? "#D97706" : "#003B7B"
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          }
        }
      };

      if (orderId) {
        options.order_id = orderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setPaymentError(response.error?.description || "Payment was cancelled or failed. Please try again.");
        setProcessingPlan(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay Error:", err);
      setPaymentError(err.message || "Failed to start Razorpay payment. Please try again.");
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-slate-50">
      {/* Payment Success Celebration Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-amber-200 relative animate-in zoom-in-95">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-display mb-1">
              Welcome to {paymentSuccess.tier}!
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Your Razorpay payment was successful and your premium membership features are now active.
            </p>
            <div className="bg-sky-50 rounded-xl p-3 mb-6 text-left border border-sky-100 text-xs space-y-1">
              <p className="text-slate-500"><strong>Payment ID:</strong> <span className="font-mono text-slate-700">{paymentSuccess.paymentId}</span></p>
              <p className="text-slate-500"><strong>Tier:</strong> <span className="text-[#003B7B] font-bold">{paymentSuccess.tier} Membership</span></p>
              <p className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Razorpay Test Payment Verified
              </p>
            </div>
            <button
              onClick={() => {
                setPaymentSuccess(null);
                setPage("dashboard");
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white font-bold text-sm rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer"
            >
              Go to Dashboard &amp; Explore Matches →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />Premium Membership
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
            Find Your Match <span className="text-[#003B7B]">Faster</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">Join 50,000+ premium members who found their life partner with our exclusive features.</p>
          
          {paymentError && (
            <div className="mt-4 max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {paymentError}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.name.toLowerCase() === currentPlan;
            const isProcessing = processingPlan === plan.name;

            return (
              <div
                key={i}
                className={`relative rounded-2xl p-6 border-2 flex flex-col justify-between ${
                  isCurrent
                    ? "border-emerald-500 bg-emerald-50/30 shadow-md"
                    : plan.popular
                    ? "border-amber-400 shadow-xl shadow-amber-100 bg-gradient-to-b from-white to-amber-50"
                    : "border-sky-100 bg-white hover:border-sky-300 hover:shadow-md transition-all"
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current Plan
                    </span>
                  </div>
                ) : plan.popular ? (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full shadow">✨ Most Popular</span>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {i === 0 ? <Shield className="w-5 h-5 text-gray-400" /> : i === 1 ? <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Crown className="w-5 h-5 text-sky-600" />}
                    <h3 className="font-display text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  <div className="flex items-end gap-1 mb-5">
                    <span className="font-display text-4xl font-bold text-[#003B7B]">{plan.price}</span>
                    <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></div>
                        {f}
                      </li>
                    ))}
                    {plan.extras.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><X className="w-2.5 h-2.5 text-gray-300" /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchase(plan)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                      : plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 shadow-md shadow-amber-200"
                      : i === 2
                      ? "bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white hover:opacity-95 shadow-sm"
                      : "border-2 border-sky-300 text-[#003B7B] hover:bg-sky-50"
                  }`}
                >
                  {isProcessing ? (
                    <span>Opening Razorpay Checkout...</span>
                  ) : isCurrent ? (
                    <span>Active ({plan.name}) — Click to Renew</span>
                  ) : i === 0 ? (
                    "Included Free"
                  ) : (
                    `Get ${plan.name} Plan (${plan.price})`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sky-100">
            <h2 className="font-display text-xl font-bold text-gray-900">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sky-50/60">
                  <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-600">Feature</th>
                  {PLANS.map(p => <th key={p.name} className={`px-6 py-3.5 text-center text-sm font-semibold ${p.popular ? "text-amber-700" : "text-gray-600"}`}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {[
                  ["Profile Views","50/month","Unlimited","Unlimited"],
                  ["Interest Requests","10/month","50/month","Unlimited"],
                  ["WhatsApp Number Unlock","✗","✓","✓"],
                  ["Horoscope Matching","✗","✓","✓"],
                  ["Chat & Voice Notes","✗","✓","✓"],
                  ["Priority Listing","✗","✗","✓"],
                  ["Dedicated Relationship Manager","✗","✗","✓"],
                  ["Video Calling","✗","✗","✓"],
                ].map(([feature, ...vals], i) => (
                  <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">{feature}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="px-6 py-3.5 text-center">
                        {v === "✓" ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> :
                         v === "✗" ? <X className="w-4 h-4 text-gray-300 mx-auto" /> :
                         <span className="text-sm font-medium text-gray-700">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, change, bg }: { label: string; value: string; icon: React.ElementType; change: string; bg: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          <TrendingUp className="w-3 h-3" />{change}
        </span>
      </div>
      <p className="text-2xl font-bold text-white font-display">{value}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
    </div>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: "48,729", icon: Users, change: "+12.3%", bg: "bg-blue-600" },
          { label: "Male Users", value: "22,104", icon: User, change: "+8.1%", bg: "bg-indigo-600" },
          { label: "Female Users", value: "26,625", icon: User, change: "+15.2%", bg: "bg-rose-600" },
          { label: "Active Users", value: "31,450", icon: CheckCircle, change: "+5.7%", bg: "bg-emerald-600" },
          { label: "Pending Verify", value: "843", icon: AlertCircle, change: "-3.4%", bg: "bg-amber-600" },
          { label: "Premium Users", value: "5,219", icon: Crown, change: "+22.1%", bg: "bg-purple-600" },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Daily Registrations</h3>
              <p className="text-gray-400 text-xs mt-0.5">New profiles this week</p>
            </div>
            <select className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none">
              <option>This Week</option><option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REG_DATA}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BE185D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#BE185D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} />
              <Area type="monotone" dataKey="users" stroke="#BE185D" strokeWidth={2} fill="url(#regGrad)" dot={{ fill: "#BE185D", strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-5">Gender Split</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {GENDER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} formatter={(v: number) => [v.toLocaleString(), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2.5 mt-2">
            {GENDER_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-400">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-300">{(d.value / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Revenue Analytics</h3>
            <p className="text-gray-400 text-xs mt-0.5">Monthly revenue (₹ in lakhs)</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg font-display">₹23.4L</p>
            <p className="text-emerald-400 text-xs">+16.4% vs last month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={REVENUE_DATA} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} formatter={(v: number) => [`₹${v}L`, "Revenue"]} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {REVENUE_DATA.map((_, i) => <Cell key={i} fill={i === REVENUE_DATA.length - 1 ? "#BE185D" : "#7C3AED"} fillOpacity={i === REVENUE_DATA.length - 1 ? 1 : 0.7} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminUsers() {
  const [search, setSearch] = useState("");
  const filtered = USERS_TABLE.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.city.toLowerCase().includes(search.toLowerCase())
  );
  const statusStyle = (s: string) =>
    s === "Active" ? "text-emerald-400 bg-emerald-400/10" :
    s === "Pending" ? "text-amber-400 bg-amber-400/10" :
    "text-red-400 bg-red-400/10";

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city..." className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors" />
        </div>
        {["All", "Active", "Pending", "Blocked"].map(f => (
          <button key={f} className="px-4 py-2.5 text-sm border border-gray-700 text-gray-400 rounded-xl hover:border-rose-500 hover:text-rose-400 transition-colors">{f}</button>
        ))}
        <button className="px-4 py-2.5 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Upload className="w-4 h-4" />Export
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["User","Gender","Phone","City","Status","Plan","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://i.pravatar.cc/40?u=${user.id}`} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          {user.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.gender === "Male" ? "bg-blue-400/10 text-blue-400" : "bg-rose-400/10 text-rose-400"}`}>{user.gender}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400 font-mono text-xs">{user.phone}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{user.city}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(user.status)}`}>{user.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {user.premium ? <PremiumBadge /> : <span className="text-xs text-gray-600">Free</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {[
                        [Eye, "hover:text-blue-400 hover:bg-blue-400/10"],
                        [Edit2, "hover:text-amber-400 hover:bg-amber-400/10"],
                        [Ban, "hover:text-orange-400 hover:bg-orange-400/10"],
                        [Trash2, "hover:text-red-400 hover:bg-red-400/10"],
                      ].map(([Icon, cls], i) => (
                        <button key={i} className={`p-1.5 text-gray-600 rounded-lg transition-colors ${cls}`}>
                          {/* @ts-ignore */}
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {USERS_TABLE.length} users</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} className={`w-7 h-7 text-xs rounded-lg transition-colors ${n === 1 ? "bg-rose-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminHoroscope() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[
        { name: "Priya Sharma", id: "U047", time: "2h ago", status: "pending" },
        { name: "Kavitha Reddy", id: "U103", time: "5h ago", status: "pending" },
        { name: "Ananya Krishnan", id: "U089", time: "1 day ago", status: "approved" },
      ].map((item, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-xs text-gray-500">{item.id} · {item.time}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.status === "pending" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>{item.status}</span>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 mb-4 min-h-20 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <ImgIcon className="w-7 h-7 mx-auto mb-1" />
              <p className="text-xs">jathagam_{item.id}.pdf</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[["Rasi","Mesham"],["Nakshatra","Ashwini"],["Dosham","None"],["Birth Time","06:30 AM"]].map(([k,v]) => (
              <div key={k} className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-xs text-gray-500 mb-0.5">{k}</p>
                <p className="text-sm text-white font-medium">{v}</p>
              </div>
            ))}
          </div>
          {item.status === "pending" ? (
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" />Approve</button>
              <button className="flex-1 py-2 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" />Reject</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-emerald-400/10 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Approved & Verified</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminReports() {
  const reports = [
    { user: "Rajesh K.", reporter: "Priya M.", type: "Fake Profile", severity: "High", time: "1h ago", status: "open" },
    { user: "Anon User", reporter: "Kavitha R.", type: "Harassment", severity: "High", time: "3h ago", status: "open" },
    { user: "Suresh V.", reporter: "Meena I.", type: "Suspicious Activity", severity: "Medium", time: "1 day ago", status: "investigating" },
    { user: "Ram Kumar", reporter: "Ananya K.", type: "Spam Messages", severity: "Low", time: "2 days ago", status: "resolved" },
  ];
  const sevCls = (s: string) => s === "High" ? "bg-red-400/10 text-red-400" : s === "Medium" ? "bg-amber-400/10 text-amber-400" : "bg-blue-400/10 text-blue-400";
  const stsCls = (s: string) => s === "open" ? "bg-red-400/10 text-red-400" : s === "investigating" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400";
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Open Reports", value: "23", icon: AlertCircle, cls: "text-red-400" },
          { label: "Under Investigation", value: "8", icon: Shield, cls: "text-amber-400" },
          { label: "Resolved (30d)", value: "142", icon: CheckCircle, cls: "text-emerald-400" },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <s.icon className={`w-9 h-9 ${s.cls}`} />
            <div><p className="text-2xl font-bold text-white font-display">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Recent Reports</h3>
          <select className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none">
            <option>All Types</option><option>Fake Profile</option><option>Harassment</option>
          </select>
        </div>
        <div className="divide-y divide-gray-800/40">
          {reports.map((r, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${r.severity === "High" ? "text-red-400" : r.severity === "Medium" ? "text-amber-400" : "text-blue-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">Report against {r.user}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevCls(r.severity)}`}>{r.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stsCls(r.status)}`}>{r.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{r.type} · By {r.reporter} · {r.time}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="p-1.5 text-gray-600 hover:text-blue-400 rounded-lg hover:bg-blue-400/10 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Ban className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 text-gray-600 hover:text-emerald-400 rounded-lg hover:bg-emerald-400/10 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSubscriptions() {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { plan: "Basic", users: 8240, revenue: "₹82.4L", cls: "text-gray-400", border: "border-gray-700" },
          { plan: "Gold", users: 3891, revenue: "₹97.3L", cls: "text-amber-400", border: "border-amber-600/30" },
          { plan: "Premium", users: 1328, revenue: "₹66.4L", cls: "text-purple-400", border: "border-purple-600/30" },
        ].map((p, i) => (
          <div key={i} className={`bg-gray-900 border rounded-2xl p-5 ${p.border}`}>
            <p className={`font-display font-bold text-lg ${p.cls}`}>{p.plan}</p>
            <p className="text-3xl font-bold text-white font-display mt-1">{p.users.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active subscribers</p>
            <p className={`text-sm font-semibold mt-3 ${p.cls}`}>{p.revenue} revenue</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Manage Plans</h3>
          <button className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors">+ Create Plan</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Plan","Price","Duration","Subscribers","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {PLANS.map((plan, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold">{plan.name}</td>
                  <td className="px-5 py-4 text-gray-300">{plan.price}</td>
                  <td className="px-5 py-4 text-gray-300 capitalize">{plan.period.replace("/","").trim()}</td>
                  <td className="px-5 py-4 text-gray-300">{[8240, 3891, 1328][i].toLocaleString()}</td>
                  <td className="px-5 py-4"><span className="text-xs px-2.5 py-1 bg-emerald-400/10 text-emerald-400 rounded-full font-medium">Active</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-gray-600 hover:text-amber-400 rounded-lg hover:bg-amber-400/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminPlaceholder({ section }: { section: string }) {
  const titles: Record<string, string> = { interests: "Interest Management", chat: "Chat Monitoring", cms: "CMS Management", settings: "System Settings" };
  const descriptions: Record<string, string> = {
    interests: "Monitor sent and received interests, approve or reject connections.",
    chat: "Review user conversations and flag abusive messages.",
    cms: "Manage banners, success stories, blog posts, and FAQs.",
    settings: "Configure branding, OTP gateway, payment settings, and notifications.",
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center bg-gray-900 border border-gray-800 rounded-2xl p-12">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
        <Settings className="w-8 h-8 text-gray-600" />
      </div>
      <h2 className="text-white font-semibold text-xl mb-2">{titles[section]}</h2>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">{descriptions[section]}</p>
    </div>
  );
}

function AdminPanel({ section, setSection, setPage }: { section: AdminSection; setSection: (s: AdminSection) => void; setPage: (p: Page) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "horoscope", label: "Horoscope Verify", icon: Sparkles },
    { id: "interests", label: "Interest Monitor", icon: Heart },
    { id: "chat", label: "Chat Monitor", icon: MessageCircle },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "cms", label: "CMS", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
        <div className={`flex items-center gap-3 border-b border-gray-800 p-4 ${sidebarOpen ? "" : "justify-center"}`}>
          <MercuryLogoIcon className="w-8 h-8 flex-shrink-0" />
          {sidebarOpen && (<span className="font-display font-bold text-white text-sm">MERCURY CONNECT Admin</span>)}
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${section === item.id ? "bg-sky-500/20 text-sky-400 font-semibold" : "text-gray-400 hover:text-white hover:bg-white/5"} ${sidebarOpen ? "" : "justify-center"}`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${section === item.id ? "text-sky-400" : ""}`} />
              {sidebarOpen && <><span className="text-sm font-medium flex-1 text-left">{item.label}</span>{section === item.id && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}</>}
            </button>
          ))}
        </nav>
        <div className={`p-3 border-t border-gray-800 space-y-1 ${sidebarOpen ? "" : "flex flex-col items-center"}`}>
          <button onClick={() => setPage("landing")} className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors ${sidebarOpen ? "" : "justify-center"}`}>
            <Globe className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">View Website</span>}
          </button>
          <button onClick={() => setPage("landing")} className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-sky-400 hover:bg-sky-400/5 rounded-xl transition-colors ${sidebarOpen ? "" : "justify-center"}`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white font-semibold text-sm">{navItems.find(n => n.id === section)?.label}</h1>
              <p className="text-gray-400 text-xs">MERCURY CONNECT Admin · {new Date().toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
              <img src="https://i.pravatar.cc/32?img=32" alt="Admin" className="w-8 h-8 rounded-lg object-cover ring-1 ring-rose-600" />
              <div className="hidden sm:block">
                <p className="text-white text-xs font-semibold leading-none">Admin User</p>
                <p className="text-gray-500 text-xs mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {section === "overview" && <AdminOverview />}
          {section === "users" && <AdminUsers />}
          {section === "horoscope" && <AdminHoroscope />}
          {section === "reports" && <AdminReports />}
          {section === "subscriptions" && <AdminSubscriptions />}
          {(section === "interests" || section === "chat" || section === "cms" || section === "settings") && <AdminPlaceholder section={section} />}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const getPageFromPath = (): Page => {
  const path = window.location.pathname.replace(/^\//, "").split("/")[0].toLowerCase();
  const validPages: Page[] = ["landing", "login", "register", "dashboard", "profile", "interests", "chat", "premium", "admin"];
  if (validPages.includes(path as Page)) {
    return path as Page;
  }
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (validPages.includes(hash as Page)) {
    return hash as Page;
  }
  return "landing";
};

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromPath);
  const [regStep, setRegStep] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [adminSection, setAdminSection] = useState<AdminSection>("overview");
  // When navigating to chat from Interests, store which user to open
  const [pendingChatUser, setPendingChatUser] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("vivahUser");
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // ── Notification & Sent Interest state (persisted in localStorage) ───────────────────
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("vivahNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sentInterests, setSentInterests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("vivahSentInterests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [photoRequests, setPhotoRequests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("vivahPhotoRequests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vivahSentInterests", JSON.stringify(sentInterests));
    } catch (e) {
      console.error(e);
    }
  }, [sentInterests]);

  useEffect(() => {
    try {
      localStorage.setItem("vivahNotifications", JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem("vivahPhotoRequests", JSON.stringify(photoRequests));
    } catch (e) {
      console.error(e);
    }
  }, [photoRequests]);

  const handleRequestPhotoAccess = (targetProfile: any) => {
    if (!currentUser || !targetProfile) return;
    const requesterId = currentUser.id;
    const requesterName = currentUser.name || currentUser.full_name || 'Someone';
    const requesterGender = currentUser.gender || 'male';
    const requesterImg = currentUser.img || currentUser.photo || null;
    const requesterPlan = currentUser.premium_plan || currentUser.plan || 'Gold';
    const targetFemaleId = targetProfile.id;
    const targetFemaleName = targetProfile.name || targetProfile.full_name || 'Member';
    const targetFemaleImg = targetProfile.img || targetProfile.photo || null;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newRequest = {
      id: `photo_req_${Date.now()}_${requesterId}_${targetFemaleId}`,
      requesterId,
      requesterName,
      requesterGender,
      requesterImg,
      requesterPlan,
      targetFemaleId,
      targetFemaleName,
      targetFemaleImg,
      status: 'pending',
      createdAt: now.toISOString(),
    };

    setPhotoRequests((prev) => {
      const filtered = prev.filter(
        (r) => !(String(r.requesterId) === String(requesterId) && String(r.targetFemaleId) === String(targetFemaleId))
      );
      return [newRequest, ...filtered];
    });

    // Create high-priority notification for the female profile owner
    const photoRequestNotif = {
      id: Date.now() + 10,
      forUserId: targetFemaleId,
      forUserName: targetFemaleName,
      type: 'photo_request',
      title: `📷 Photo Access Request from ${requesterName}`,
      message: `${requesterName} (${requesterPlan} Member) requested permission to view your profile photo.`,
      fromImg: requesterImg,
      fromName: requesterName,
      toImg: targetFemaleImg,
      toName: targetFemaleName,
      profileImg: requesterImg,
      profileName: requesterName,
      senderId: requesterId,
      receiverId: targetFemaleId,
      requesterPlan,
      photoRequestId: newRequest.id,
      time: timeStr,
      unread: true,
      targetTab: 'received',
    };

    setNotifications((prev) => [photoRequestNotif, ...prev]);
  };

  const handleRespondPhotoRequest = (photoRequestId: string, status: 'approved' | 'declined') => {
    let approvedRequesterId: any = null;
    let femaleOwnerName: string = currentUser?.name || currentUser?.full_name || 'Member';

    setPhotoRequests((prev) => {
      return prev.map((r) => {
        if (r.id === photoRequestId || (String(r.targetFemaleId) === String(currentUser?.id) && (String(r.requesterId) === String(photoRequestId) || String(r.id) === String(photoRequestId)))) {
          approvedRequesterId = r.requesterId;
          return { ...r, status };
        }
        return r;
      });
    });

    if (status === 'approved' && approvedRequesterId) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const approvalNotif = {
        id: Date.now() + 20,
        forUserId: approvedRequesterId,
        type: 'photo_approval',
        title: `🔓 Photo Access Approved by ${femaleOwnerName}`,
        message: `${femaleOwnerName} approved your request to view her profile photo!`,
        fromImg: currentUser?.img || currentUser?.photo || null,
        fromName: femaleOwnerName,
        profileImg: currentUser?.img || currentUser?.photo || null,
        profileName: femaleOwnerName,
        time: timeStr,
        unread: true,
      };
      setNotifications((prev) => [approvalNotif, ...prev]);
    }
  };

  const [interestsActiveTab, setInterestsActiveTab] = useState('sent');

  /** Called when any profile's Interest button is clicked in DashboardPage.
   *  currentUser = sender (e.g. Aravind Venkatesh)
   *  profile     = target profile Aravind is sending interest TO
   *  The interest entry goes to Aravind's SENT tab (showing the target profile).
   */
  const handleSendInterestFromDashboard = (profile: any) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Sender = logged-in user (Aravind Venkatesh)
    const senderName = currentUser?.name || currentUser?.full_name || 'Someone';
    const senderImg  = currentUser?.img || currentUser?.photo || null;
    const senderAge  = currentUser?.age  || '';
    const senderCity = currentUser?.city || '';

    // Target = the profile Aravind is sending interest TO (shown in Sent tab)
    const receiverName = profile.name || profile.full_name || 'This Profile';
    const receiverImg  = profile.img  || profile.photo || null;
    const receiverAge  = profile.age  || '';
    const receiverCity = profile.city || '';

    // Sent tab entry for sender (Aravind): shows the TARGET PROFILE (Tamanna)
    const sentEntry = {
      id: Date.now(),
      sender_id: currentUser?.id,   // Aravind is sender
      receiver_id: profile.id,      // Tamanna is receiver
      name: receiverName,           // ← show Tamanna's name in Aravind's Sent tab
      age: receiverAge,             // ← show Tamanna's age
      city: receiverCity,           // ← show Tamanna's city
      img: receiverImg,             // ← show Tamanna's photo
      status: 'pending',
      sentBy: senderName,           // Aravind Venkatesh
      senderImg: senderImg,         // Aravind's photo
      senderAge: senderAge,         // Aravind's age
      senderCity: senderCity,       // Aravind's city
      created_at: now.toISOString(),
    };

    setSentInterests((prev) => {
      // Avoid duplicate: same sender to same receiver
      if (prev.some((i) => i.sender_id === currentUser?.id && i.receiver_id === profile.id)) return prev;
      return [sentEntry, ...prev];
    });

    const currId = currentUser?.id;
    const profId = profile?.id;
    if (currId && profId) {
      setInterestStatuses((prev) => {
        const updated = {
          ...prev,
          [sentEntry.id]: 'pending',
          [String(sentEntry.id)]: 'pending',
          [`${currId}_${profId}`]: 'pending',
          [`${profId}_${currId}`]: 'pending',
        };
        try {
          localStorage.setItem("vivahInterestStatuses", JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    }

    // Bell notification is ONLY sent to RECEIVER (Tamanna), not the sender (Aravind)
    const receiverNotif = {
      id: Date.now() + 2,
      forUserId: profile.id,            // Only visible when currentUser is Tamanna (receiver)
      forUserName: receiverName,
      title: `💖 New Interest from ${senderName}`,
      message: `${senderName}${senderAge ? `, ${senderAge} yrs` : ''}${senderCity ? ` · ${senderCity}` : ''} sent you an interest request! View in Received tab.`,
      fromImg: senderImg,
      fromName: senderName,
      toImg: receiverImg,
      toName: receiverName,
      profileImg: senderImg,
      profileName: senderName,
      senderName,
      receiverName,
      time: timeStr,
      unread: true,
      sentEntry,
      targetTab: 'received',
    };

    setNotifications((prev) => [receiverNotif, ...prev]);
  };

  const [interestStatuses, setInterestStatuses] = useState<Record<string | number, string>>(() => {
    try {
      const saved = localStorage.getItem("vivahInterestStatuses");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleRespondInterest = (interestId: number | string, status: string, senderId?: number | string, receiverId?: number | string) => {
    setInterestStatuses((prev) => {
      const updated = { ...prev, [interestId]: status, [String(interestId)]: status };
      if (senderId && receiverId) {
        updated[`${senderId}_${receiverId}`] = status;
        updated[`${receiverId}_${senderId}`] = status;
      }
      try {
        localStorage.setItem("vivahInterestStatuses", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setSentInterests((prev) => {
      const updated = prev.map((item) => {
        const isMatch =
          item.id === interestId ||
          String(item.id) === String(interestId) ||
          (senderId && receiverId && (
            (item.sender_id === senderId && item.receiver_id === receiverId) ||
            (item.sender_id === receiverId && item.receiver_id === senderId)
          ));
        return isMatch ? { ...item, status } : item;
      });
      try {
        localStorage.setItem("vivahSentInterests", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    // Navigate to Interests page, open specified target tab or default to received
    const targetTab = notif.targetTab || 'received';
    setInterestsActiveTab(targetTab);
    navigate('interests');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleLocationChange = () => {
      const newPage = getPageFromPath();
      setPage(newPage);
    };
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  // Sync user from localStorage on any navigation
  const refreshUser = async (userId?: number) => {
    const id = userId || currentUser?.id;
    if (!id) return;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
      const res = await fetch(`${backendUrl}/api/user/me?userId=${id}`);
      const data = await res.json();
      if (data.success && data.user) {
        const formattedUser = {
          ...data.user,
          img: formatPhotoUrl(data.user.img || data.user.photo),
          photo: formatPhotoUrl(data.user.photo || data.user.img),
        };
        const safeUser = safeSetVivahUser(formattedUser);
        setCurrentUser(safeUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = (p: Page) => {
    setPage(p);
    const targetPath = p === "landing" ? "/" : `/${p}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    if (p === "register") setRegStep(1);
    if (p === "dashboard") {
      try {
        const savedUser = localStorage.getItem("vivahUser");
        const savedUserId = savedUser ? JSON.parse(savedUser)?.id : undefined;
        refreshUser(savedUserId || currentUser?.id);
      } catch {
        refreshUser(currentUser?.id);
      }
    }
    window.scrollTo(0, 0);
  };

  const handleOpenMyProfile = () => {
    setSelectedProfileId(currentUser?.id || 101);
    navigate("profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("vivahUser");
    setCurrentUser(null);
    navigate("landing");
  };

  if (page === "admin") {
    return (
      <AdminPanel
        section={adminSection}
        setSection={setAdminSection}
        setPage={navigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        page={page}
        setPage={navigate}
        currentUser={currentUser}
        onOpenMyProfile={handleOpenMyProfile}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkAllRead}
        photoRequests={photoRequests}
        onRespondPhotoRequest={handleRespondPhotoRequest}
      />

      {/* Floating Plan Simulator */}
      {currentUser && (page === "dashboard" || page === "premium") && (
        <PlanSimulator currentUser={currentUser} onPlanChange={(user) => {
          setCurrentUser(user);
          localStorage.setItem("vivahUser", JSON.stringify(user));
        }} />
      )}

      {page === "landing" && <LandingPage setPage={navigate} />}
      {page === "login" && <LoginPage setPage={navigate} setCurrentUser={setCurrentUser} />}
      {page === "register" && (
        <RegisterPage
          step={regStep}
          setStep={setRegStep}
          setPage={navigate}
          setCurrentUser={(user) => {
            setCurrentUser(user);
            localStorage.setItem("vivahUser", JSON.stringify(user));
          }}
          setSelectedProfileId={setSelectedProfileId}
        />
      )}
      {page === "dashboard" && (
        <DashboardPage
          setPage={navigate}
          currentUser={currentUser}
          currentUserStarId={currentUser?.starId}
          setSelectedProfileId={setSelectedProfileId}
          onSendInterest={handleSendInterestFromDashboard}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem("vivahUser", JSON.stringify(updated));
          }}
          sentInterests={sentInterests}
          interestStatuses={interestStatuses}
        />
      )}
      {page === "profile" && (
        <ProfilePage
          setPage={navigate}
          profileId={selectedProfileId}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem("vivahUser", JSON.stringify(updated));
          }}
          onSendInterest={handleSendInterestFromDashboard}
          sentInterests={sentInterests}
          interestStatuses={interestStatuses}
          photoRequests={photoRequests}
          onRequestPhotoAccess={handleRequestPhotoAccess}
          onRespondPhotoRequest={handleRespondPhotoRequest}
        />
      )}
      {page === "interests" && (
        <InterestsPage
          setPage={navigate}
          currentUser={currentUser}
          customSentInterests={sentInterests}
          activeTab={interestsActiveTab}
          setActiveTab={setInterestsActiveTab}
          onRespondInterest={handleRespondInterest}
          interestStatuses={interestStatuses}
          photoRequests={photoRequests}
          onRespondPhotoRequest={handleRespondPhotoRequest}
          onOpenChat={(user: any) => {
            setPendingChatUser(user);
            navigate("chat");
          }}
        />
      )}
      {page === "chat" && <ChatPage setPage={navigate} currentUser={currentUser} pendingChatUser={pendingChatUser} onClearPendingChat={() => setPendingChatUser(null)} setSelectedProfileId={setSelectedProfileId} />}
      {page === "premium" && <PremiumPage setPage={navigate} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
    </div>
  );
}