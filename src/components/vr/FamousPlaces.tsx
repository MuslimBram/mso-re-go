import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export interface FamousPlace {
  name: string;
  lat: number;
  lng: number;
  category: "islamic" | "world" | "nature" | "city";
  heading?: number;
}

export const FAMOUS_PLACES: FamousPlace[] = [
  // 🕋 Vende të shenjta islame
  { name: "🕋 Qabeja — Mekë", lat: 21.4225, lng: 39.8262, category: "islamic" },
  { name: "🕌 El-Mesxhid en-Nebeui — Medinë", lat: 24.4672, lng: 39.6111, category: "islamic" },
  { name: "🕌 Xhamia Al-Aksa — Kudus", lat: 31.7780, lng: 35.2354, category: "islamic" },
  { name: "🏔️ Mali Arafat", lat: 21.3548, lng: 39.9843, category: "islamic" },
  { name: "🏞️ Mina", lat: 21.4133, lng: 39.8933, category: "islamic" },
  { name: "🌄 Xhebel al-Nur (Hira)", lat: 21.4577, lng: 39.8597, category: "islamic" },
  { name: "🕌 Imam Ali — Najaf", lat: 32.0006, lng: 44.3147, category: "islamic" },
  { name: "🕌 Imam Husein — Karbala", lat: 32.6164, lng: 44.0322, category: "islamic" },
  { name: "🕌 Xhamia Blu — Stamboll", lat: 41.0054, lng: 28.9768, category: "islamic" },
  { name: "🕌 Sheikh Zayed — Abu Dhabi", lat: 24.4128, lng: 54.4748, category: "islamic" },
  { name: "🕌 Hassan II — Kazablanka", lat: 33.6082, lng: -7.6326, category: "islamic" },
  { name: "🕌 Et'hem Bey — Tiranë", lat: 41.3275, lng: 19.8189, category: "islamic" },
  { name: "📚 Timbuktu", lat: 16.7666, lng: -3.0026, category: "islamic" },
  { name: "🕌 Sulejmanije — Stamboll", lat: 41.0161, lng: 28.9639, category: "islamic" },
  { name: "🕌 Xhamia e Kordobës", lat: 37.8790, lng: -4.7794, category: "islamic" },
  { name: "🕌 Badshahi — Lahore", lat: 31.5880, lng: 74.3104, category: "islamic" },
  { name: "🕌 Faisal — Islamabad", lat: 33.7295, lng: 73.0372, category: "islamic" },
  { name: "🕌 Xhamia e Kairos (Al-Azhar)", lat: 30.0459, lng: 31.2625, category: "islamic" },
  { name: "🕌 Xhamia Bibi-Khanym — Samarkand", lat: 39.6606, lng: 66.9758, category: "islamic" },
  { name: "🕌 Kubbet'us-Sahra — Kudus", lat: 31.7781, lng: 35.2354, category: "islamic" },

  // 🗼 Monumente botërore
  { name: "🗼 Kulla Eiffel — Paris", lat: 48.8584, lng: 2.2945, category: "world" },
  { name: "🗽 Statuja e Lirisë — New York", lat: 40.6892, lng: -74.0445, category: "world" },
  { name: "🏟️ Koloseu — Romë", lat: 41.8902, lng: 12.4922, category: "world" },
  { name: "🏯 Muri i Madh — Kinë", lat: 40.4319, lng: 116.5704, category: "world" },
  { name: "🕌 Shën Sofia — Stamboll", lat: 41.0086, lng: 28.9802, category: "world" },
  { name: "🏝️ Burj Khalifa — Dubai", lat: 25.1972, lng: 55.2744, category: "world" },
  { name: "🗿 Machu Picchu — Peru", lat: -13.1631, lng: -72.5450, category: "world" },
  { name: "🛕 Taj Mahal — Indi", lat: 27.1751, lng: 78.0421, category: "world" },
  { name: "⛪ Sagrada Familia — Barcelonë", lat: 41.4036, lng: 2.1744, category: "world" },
  { name: "🏛️ Akropoli — Athinë", lat: 37.9715, lng: 23.7267, category: "world" },
  { name: "🎡 London Eye — Londër", lat: 51.5033, lng: -0.1196, category: "world" },
  { name: "🌉 Golden Gate — San Francisco", lat: 37.8199, lng: -122.4783, category: "world" },
  { name: "🗼 Kulla e Tokios", lat: 35.6586, lng: 139.7454, category: "world" },
  { name: "🏛️ Brandenburg Gate — Berlin", lat: 52.5163, lng: 13.3777, category: "world" },
  { name: "🕍 Notre-Dame — Paris", lat: 48.8530, lng: 2.3499, category: "world" },
  { name: "🗿 Krishti Çlirimtar — Rio", lat: -22.9519, lng: -43.2105, category: "world" },
  { name: "🏛️ Pantheon — Romë", lat: 41.8986, lng: 12.4769, category: "world" },
  { name: "🕌 Kremlin — Moskë", lat: 55.7520, lng: 37.6175, category: "world" },
  { name: "🏛️ Piramidat e Gizës", lat: 29.9792, lng: 31.1342, category: "world" },
  { name: "🦁 Sfinksi i Madh — Egjipt", lat: 29.9753, lng: 31.1376, category: "world" },
  { name: "🏛️ Petra — Jordani", lat: 30.3285, lng: 35.4444, category: "world" },
  { name: "🗽 Big Ben — Londër", lat: 51.5007, lng: -0.1246, category: "world" },
  { name: "🌉 Tower Bridge — Londër", lat: 51.5055, lng: -0.0754, category: "world" },
  { name: "🏰 Kalaja e Pragës", lat: 50.0909, lng: 14.4006, category: "world" },
  { name: "🏰 Neuschwanstein — Gjermani", lat: 47.5576, lng: 10.7498, category: "world" },
  { name: "🗼 CN Tower — Toronto", lat: 43.6426, lng: -79.3871, category: "world" },
  { name: "🏛️ Casa Milà — Barcelonë", lat: 41.3954, lng: 2.1619, category: "world" },
  { name: "🏛️ Versailles — Francë", lat: 48.8049, lng: 2.1204, category: "world" },
  { name: "🏛️ Angkor Wat — Kamboxhia", lat: 13.4125, lng: 103.8670, category: "world" },
  { name: "🛕 Borobudur — Indonezi", lat: -7.6079, lng: 110.2038, category: "world" },
  { name: "🗿 Stonehenge — Angli", lat: 51.1789, lng: -1.8262, category: "world" },
  { name: "🏛️ Alhambra — Granada", lat: 37.1761, lng: -3.5881, category: "world" },
  { name: "🌋 Mount Rushmore — SHBA", lat: 43.8791, lng: -103.4591, category: "world" },
  { name: "🗼 Space Needle — Seattle", lat: 47.6205, lng: -122.3493, category: "world" },
  { name: "🏛️ Forbidden City — Pekin", lat: 39.9163, lng: 116.3972, category: "world" },
  { name: "🏛️ Hagia Sophia — Stamboll", lat: 41.0086, lng: 28.9802, category: "world" },
  { name: "🏰 Edinburgh Castle", lat: 55.9486, lng: -3.1999, category: "world" },
  { name: "🏰 Mont Saint-Michel — Francë", lat: 48.6361, lng: -1.5115, category: "world" },
  { name: "🏛️ Trevi Fountain — Romë", lat: 41.9009, lng: 12.4833, category: "world" },
  { name: "🛕 Wat Pho — Bangkok", lat: 13.7465, lng: 100.4927, category: "world" },
  { name: "🏯 Himeji Castle — Japoni", lat: 34.8394, lng: 134.6939, category: "world" },
  { name: "🏛️ Buckingham Palace — Londër", lat: 51.5014, lng: -0.1419, category: "world" },
  { name: "🏛️ White House — Washington", lat: 38.8977, lng: -77.0365, category: "world" },
  { name: "🗽 Hollywood Sign — LA", lat: 34.1341, lng: -118.3215, category: "world" },
  { name: "🏛️ Atomium — Bruksel", lat: 50.8949, lng: 4.3415, category: "world" },
  { name: "🏛️ Leaning Tower — Pisa", lat: 43.7230, lng: 10.3966, category: "world" },
  { name: "🏛️ Plaza de España — Sevilje", lat: 37.3772, lng: -5.9869, category: "world" },
  { name: "🏛️ Arc de Triomphe — Paris", lat: 48.8738, lng: 2.2950, category: "world" },
  { name: "🏛️ Louvre Pyramid — Paris", lat: 48.8606, lng: 2.3376, category: "world" },
  { name: "🏛️ St. Peter's Square — Vatikan", lat: 41.9022, lng: 12.4574, category: "world" },
  { name: "🏛️ Spanish Steps — Romë", lat: 41.9059, lng: 12.4823, category: "world" },
  { name: "🏛️ Lincoln Memorial — Washington", lat: 38.8893, lng: -77.0502, category: "world" },
  { name: "🏛️ US Capitol — Washington", lat: 38.8899, lng: -77.0091, category: "world" },
  { name: "🌉 Rialto Bridge — Venecia", lat: 45.4380, lng: 12.3359, category: "world" },
  { name: "🏰 Windsor Castle — Angli", lat: 51.4839, lng: -0.6044, category: "world" },
  { name: "🏛️ Schönbrunn — Vjenë", lat: 48.1845, lng: 16.3122, category: "world" },
  { name: "🏛️ Palace of Westminster — Londër", lat: 51.4995, lng: -0.1248, category: "world" },
  { name: "🏛️ Reichstag — Berlin", lat: 52.5186, lng: 13.3762, category: "world" },
  { name: "⛪ Köln Cathedral — Gjermani", lat: 50.9413, lng: 6.9583, category: "world" },
  { name: "⛪ Milan Cathedral (Duomo)", lat: 45.4642, lng: 9.1900, category: "world" },
  { name: "🏛️ Hermitage — Shën Petersburg", lat: 59.9398, lng: 30.3146, category: "world" },
  { name: "🛕 Meiji Shrine — Tokio", lat: 35.6764, lng: 139.6993, category: "world" },
  { name: "🛕 Senso-ji — Tokio", lat: 35.7148, lng: 139.7967, category: "world" },
  { name: "🛕 Fushimi Inari — Kioto", lat: 34.9671, lng: 135.7727, category: "world" },
  { name: "🏯 Kinkaku-ji — Kioto", lat: 35.0394, lng: 135.7292, category: "world" },
  { name: "🌉 Ponte Vecchio — Firence", lat: 43.7680, lng: 11.2531, category: "world" },
  { name: "🏛️ Uffizi — Firence", lat: 43.7678, lng: 11.2553, category: "world" },
  { name: "🏛️ Plaza de la Constitución — Mexiko Siti", lat: 19.4326, lng: -99.1332, category: "world" },
  { name: "🏛️ Christ Church — Dublin", lat: 53.3434, lng: -6.2710, category: "world" },
  { name: "🌉 Ponte 25 de Abril — Lisbonë", lat: 38.6896, lng: -9.1772, category: "world" },
  { name: "🏛️ Belém Tower — Lisbonë", lat: 38.6916, lng: -9.2160, category: "world" },

  // 🌄 Natyrë
  { name: "🏔️ Mount Everest — Bazë", lat: 28.0026, lng: 86.8528, category: "nature" },
  { name: "🌋 Grand Canyon — SHBA", lat: 36.0544, lng: -112.1401, category: "nature" },
  { name: "🏞️ Niagara Falls", lat: 43.0962, lng: -79.0377, category: "nature" },
  { name: "🌅 Santorini — Greqi", lat: 36.3932, lng: 25.4615, category: "nature" },
  { name: "🏖️ Maldivet", lat: 3.2028, lng: 73.2207, category: "nature" },
  { name: "🌳 Amazon — Manaus", lat: -3.1190, lng: -60.0217, category: "nature" },
  { name: "🏔️ Alpet Zvicerane — Matterhorn", lat: 45.9763, lng: 7.6586, category: "nature" },
  { name: "🌊 Great Barrier Reef", lat: -16.7000, lng: 145.9667, category: "nature" },
  { name: "💦 Iguazu Falls — Brazil/Argjentinë", lat: -25.6953, lng: -54.4367, category: "nature" },
  { name: "🏝️ Bora Bora", lat: -16.5004, lng: -151.7415, category: "nature" },
  { name: "🌋 Vullkani Kilauea — Havai", lat: 19.4069, lng: -155.2834, category: "nature" },
  { name: "🏞️ Plitvice — Kroaci", lat: 44.8654, lng: 15.5820, category: "nature" },
  { name: "🏔️ Fjordet — Norvegji", lat: 60.8694, lng: 7.0667, category: "nature" },
  { name: "🌵 Sahara — Maroc", lat: 31.0801, lng: -4.0133, category: "nature" },
  { name: "🦁 Serengeti — Tanzani", lat: -2.3333, lng: 34.8333, category: "nature" },
  { name: "🏔️ Liqeni i Ohrit", lat: 41.0297, lng: 20.7080, category: "nature" },
  { name: "🏖️ Ksamil — Shqipëri", lat: 39.7672, lng: 20.0014, category: "nature" },
  { name: "🏔️ Theth — Alpet Shqiptare", lat: 42.3933, lng: 19.7669, category: "nature" },
  { name: "🏞️ Lake Bled — Slloveni", lat: 46.3625, lng: 14.0883, category: "nature" },
  { name: "🌋 Vullkani Fuji — Japoni", lat: 35.3606, lng: 138.7274, category: "nature" },
  { name: "🏔️ Banff — Kanada", lat: 51.4968, lng: -115.9281, category: "nature" },
  { name: "🏖️ Whitehaven Beach — Australi", lat: -20.2814, lng: 149.0381, category: "nature" },
  { name: "🌊 Cliffs of Moher — Irlandë", lat: 52.9716, lng: -9.4309, category: "nature" },
  { name: "🏔️ Cappadocia — Turqi", lat: 38.6431, lng: 34.8289, category: "nature" },
  { name: "🏞️ Yellowstone — SHBA", lat: 44.4280, lng: -110.5885, category: "nature" },
  { name: "🏖️ Phi Phi Islands — Tajlandë", lat: 7.7407, lng: 98.7784, category: "nature" },
  { name: "🌅 Uluru (Ayers Rock) — Australi", lat: -25.3444, lng: 131.0369, category: "nature" },
  { name: "🏔️ Dolomitet — Itali", lat: 46.4102, lng: 11.8440, category: "nature" },
  { name: "🏞️ Liqeni i Shkodrës", lat: 42.1566, lng: 19.5450, category: "nature" },
  { name: "🏔️ Kanioni i Osumit — Shqipëri", lat: 40.4906, lng: 20.2469, category: "nature" },
  { name: "🏞️ Liqenet e Lurës", lat: 41.7811, lng: 20.1953, category: "nature" },
  { name: "🏖️ Dhërmi — Shqipëri", lat: 40.1442, lng: 19.6478, category: "nature" },
  { name: "🏔️ Mount Olympus — Greqi", lat: 40.0863, lng: 22.3589, category: "nature" },
  { name: "🏞️ Hallstatt — Austri", lat: 47.5622, lng: 13.6493, category: "nature" },
  { name: "🏝️ Capri — Itali", lat: 40.5532, lng: 14.2222, category: "nature" },
  { name: "🏖️ Positano — Itali", lat: 40.6280, lng: 14.4848, category: "nature" },
  { name: "🏖️ Nice — Riviera Franceze", lat: 43.6952, lng: 7.2658, category: "nature" },
  { name: "🏔️ Lauterbrunnen — Zvicër", lat: 46.5933, lng: 7.9082, category: "nature" },
  { name: "🏔️ Interlaken — Zvicër", lat: 46.6863, lng: 7.8632, category: "nature" },
  { name: "🏞️ Geirangerfjord — Norvegji", lat: 62.1015, lng: 7.0954, category: "nature" },
  { name: "🌅 Reykjavik — Islandë", lat: 64.1466, lng: -21.9426, category: "nature" },
  { name: "🏖️ Copacabana — Rio", lat: -22.9711, lng: -43.1822, category: "nature" },
  { name: "🏖️ Waikiki Beach — Honolulu", lat: 21.2767, lng: -157.8276, category: "nature" },
  { name: "🏔️ Zermatt — Zvicër", lat: 46.0207, lng: 7.7491, category: "nature" },
  { name: "🏔️ Chamonix — Francë", lat: 45.9237, lng: 6.8694, category: "nature" },
  { name: "🏖️ Sveti Stefan — Mali i Zi", lat: 42.2581, lng: 18.8910, category: "nature" },
  { name: "🏞️ Kotor — Mali i Zi", lat: 42.4247, lng: 18.7712, category: "nature" },
  { name: "🏖️ Mykonos — Greqi", lat: 37.4467, lng: 25.3289, category: "nature" },
  { name: "🏖️ Ibiza — Spanjë", lat: 38.9067, lng: 1.4206, category: "nature" },
  { name: "🏔️ Berchtesgaden — Gjermani", lat: 47.6307, lng: 13.0033, category: "nature" },
  { name: "🏖️ Nazaré — Portugali", lat: 39.6049, lng: -9.0700, category: "nature" },

  // 🌆 Qytete të frekuentuara
  { name: "🌆 Times Square — New York", lat: 40.7580, lng: -73.9855, category: "city" },
  { name: "🚦 Shibuya — Tokio", lat: 35.6595, lng: 139.7004, category: "city" },
  { name: "🎰 Las Vegas Strip", lat: 36.1147, lng: -115.1728, category: "city" },
  { name: "🌉 Sydney Opera", lat: -33.8568, lng: 151.2153, category: "city" },
  { name: "🏙️ Singapore Marina Bay", lat: 1.2834, lng: 103.8607, category: "city" },
  { name: "🕌 Sheshi i Kuq — Moskë", lat: 55.7539, lng: 37.6208, category: "city" },
  { name: "🌃 Hong Kong Skyline", lat: 22.2793, lng: 114.1628, category: "city" },
  { name: "🏛️ Sheshi Skënderbej — Tiranë", lat: 41.3281, lng: 19.8187, category: "city" },
  { name: "🌉 Brooklyn Bridge — NYC", lat: 40.7061, lng: -73.9969, category: "city" },
  { name: "🏙️ Champs-Élysées — Paris", lat: 48.8698, lng: 2.3079, category: "city" },
  { name: "🏙️ Piccadilly Circus — Londër", lat: 51.5101, lng: -0.1342, category: "city" },
  { name: "🏙️ Plaza Mayor — Madrid", lat: 40.4155, lng: -3.7074, category: "city" },
  { name: "🏙️ Trafalgar Square — Londër", lat: 51.5080, lng: -0.1281, category: "city" },
  { name: "🏙️ Sheshi i Shën Markut — Venecia", lat: 45.4341, lng: 12.3388, category: "city" },
  { name: "🏙️ Sheshi i Kuq — Pekin (Tiananmen)", lat: 39.9055, lng: 116.3976, category: "city" },
  { name: "🏙️ Dam Square — Amsterdam", lat: 52.3731, lng: 4.8926, category: "city" },
  { name: "🏙️ Wenceslas Square — Pragë", lat: 50.0810, lng: 14.4267, category: "city" },
  { name: "🏙️ Sheshi Taksim — Stamboll", lat: 41.0370, lng: 28.9850, category: "city" },
  { name: "🏙️ Old Quebec — Kanada", lat: 46.8129, lng: -71.2080, category: "city" },
  { name: "🏙️ Marina Beach — Dubai", lat: 25.0785, lng: 55.1390, category: "city" },
  { name: "🏙️ Bulevardi Dëshmorët — Prishtinë", lat: 42.6629, lng: 21.1655, category: "city" },
  { name: "🏙️ Sheshi Liria — Shkup", lat: 41.9962, lng: 21.4316, category: "city" },
  { name: "🌃 Marina Bay Sands — Singapor", lat: 1.2834, lng: 103.8607, category: "city" },
  { name: "🌆 Burj Al Arab — Dubai", lat: 25.1413, lng: 55.1853, category: "city" },
  { name: "🌃 Ginza — Tokio", lat: 35.6717, lng: 139.7650, category: "city" },
  { name: "🌆 Gangnam — Seul", lat: 37.4979, lng: 127.0276, category: "city" },
  { name: "🌃 Bourbon Street — New Orleans", lat: 29.9590, lng: -90.0670, category: "city" },
  { name: "🌉 Charles Bridge — Pragë", lat: 50.0865, lng: 14.4114, category: "city" },
  { name: "🏙️ Grand Bazaar — Stamboll", lat: 41.0108, lng: 28.9680, category: "city" },
  { name: "🌆 La Rambla — Barcelonë", lat: 41.3818, lng: 2.1716, category: "city" },
  { name: "🌃 Lan Kwai Fong — Hong Kong", lat: 22.2811, lng: 114.1554, category: "city" },
  { name: "🌆 Pjaca — Split, Kroaci", lat: 43.5081, lng: 16.4402, category: "city" },
  { name: "🏙️ Sheshi Maqedonia — Shkup", lat: 41.9959, lng: 21.4319, category: "city" },
  { name: "🌃 Newa Promenade — Shën Petersburg", lat: 59.9398, lng: 30.3146, category: "city" },
  { name: "🏙️ Plaka — Athinë", lat: 37.9714, lng: 23.7299, category: "city" },
  { name: "🌆 Soho — New York", lat: 40.7233, lng: -74.0030, category: "city" },
  { name: "🌃 Central Park — New York", lat: 40.7829, lng: -73.9654, category: "city" },
  { name: "🌆 Beverly Hills — LA", lat: 34.0736, lng: -118.4004, category: "city" },
  { name: "🌆 South Beach — Miami", lat: 25.7826, lng: -80.1340, category: "city" },
  { name: "🌃 Downtown — Chicago", lat: 41.8827, lng: -87.6233, category: "city" },
  { name: "🌉 Millennium Park — Chicago", lat: 41.8826, lng: -87.6226, category: "city" },
  { name: "🌆 Quartier Latin — Paris", lat: 48.8499, lng: 2.3447, category: "city" },
  { name: "🌆 Montmartre — Paris", lat: 48.8867, lng: 2.3431, category: "city" },
  { name: "🌆 Covent Garden — Londër", lat: 51.5117, lng: -0.1240, category: "city" },
  { name: "🌃 Shoreditch — Londër", lat: 51.5260, lng: -0.0786, category: "city" },
  { name: "🌆 Kreuzberg — Berlin", lat: 52.4974, lng: 13.4179, category: "city" },
  { name: "🌃 Trastevere — Romë", lat: 41.8896, lng: 12.4695, category: "city" },
  { name: "🌆 Gothic Quarter — Barcelonë", lat: 41.3833, lng: 2.1768, category: "city" },
  { name: "🌆 Zócalo — Mexiko Siti", lat: 19.4326, lng: -99.1332, category: "city" },
  { name: "🌃 Palermo Soho — Buenos Aires", lat: -34.5887, lng: -58.4308, category: "city" },
  { name: "🌆 Bondi Beach — Sidnei", lat: -33.8915, lng: 151.2767, category: "city" },
  { name: "🌃 Orchard Road — Singapor", lat: 1.3048, lng: 103.8318, category: "city" },
  { name: "🌆 Khao San Road — Bangkok", lat: 13.7589, lng: 100.4977, category: "city" },
  { name: "🌃 Myeongdong — Seul", lat: 37.5636, lng: 126.9869, category: "city" },
  { name: "🌆 Kalemegdan — Beograd", lat: 44.8225, lng: 20.4500, category: "city" },
  { name: "🌆 Stari Grad — Sarajevë", lat: 43.8595, lng: 18.4313, category: "city" },
  { name: "🌆 Bulevardi Nënë Tereza — Prishtinë", lat: 42.6612, lng: 21.1655, category: "city" },
  { name: "🌃 Pazari i Ri — Tiranë", lat: 41.3296, lng: 19.8222, category: "city" },
  { name: "🌆 Korçë — Pazari i Vjetër", lat: 40.6186, lng: 20.7808, category: "city" },
  { name: "🌆 Berat — Mangalem", lat: 40.7058, lng: 19.9522, category: "city" },
  { name: "🌆 Gjirokastër — Kalaja", lat: 40.0758, lng: 20.1389, category: "city" },

  // 🌍 Vende të reja turistike (të verifikuara në Street View)
  { name: "🏛️ Place de la Concorde — Paris", lat: 48.8656, lng: 2.3211, category: "world" },
  { name: "🏛️ Pont Alexandre III — Paris", lat: 48.8638, lng: 2.3133, category: "world" },
  { name: "🌉 Charles Bridge Tower — Pragë", lat: 50.0865, lng: 14.4138, category: "world" },
  { name: "🏰 Bran Castle — Rumani", lat: 45.5149, lng: 25.3672, category: "world" },
  { name: "🏰 Peles Castle — Rumani", lat: 45.3601, lng: 25.5425, category: "world" },
  { name: "🏛️ Sheshi Wenceslas — Pragë", lat: 50.0810, lng: 14.4267, category: "world" },
  { name: "🌉 Pont du Gard — Francë", lat: 43.9474, lng: 4.5350, category: "world" },
  { name: "🏛️ Mostar Bridge — BiH", lat: 43.3370, lng: 17.8150, category: "world" },
  { name: "🏛️ Diocletian's Palace — Split", lat: 43.5089, lng: 16.4407, category: "world" },
  { name: "🏛️ Bernauer Wall — Berlin", lat: 52.5354, lng: 13.3892, category: "world" },
  { name: "🏛️ Checkpoint Charlie — Berlin", lat: 52.5076, lng: 13.3904, category: "world" },
  { name: "🛕 Wat Arun — Bangkok", lat: 13.7437, lng: 100.4889, category: "world" },
  { name: "🏛️ Royal Palace — Madrid", lat: 40.4180, lng: -3.7144, category: "world" },
  { name: "🏛️ Plaza de Cibeles — Madrid", lat: 40.4194, lng: -3.6928, category: "world" },
  { name: "🏛️ Palau Nacional — Barcelonë", lat: 41.3686, lng: 2.1535, category: "world" },

  { name: "🏖️ Navagio Beach — Zakynthos", lat: 37.8593, lng: 20.6249, category: "nature" },
  { name: "🏔️ Tre Cime di Lavaredo — Itali", lat: 46.6181, lng: 12.3056, category: "nature" },
  { name: "🏞️ Lake Como — Itali", lat: 45.9821, lng: 9.2598, category: "nature" },
  { name: "🏞️ Garda Lake — Itali", lat: 45.6448, lng: 10.6878, category: "nature" },
  { name: "🏖️ Algarve — Portugali", lat: 37.0890, lng: -8.2479, category: "nature" },
  { name: "🏔️ Tatra Mountains — Poloni", lat: 49.2330, lng: 19.9810, category: "nature" },
  { name: "🏞️ Lake Ohrid — Maqedoni", lat: 41.1117, lng: 20.8019, category: "nature" },
  { name: "🏞️ Llogara Pass — Shqipëri", lat: 40.2104, lng: 19.5706, category: "nature" },
  { name: "🏞️ Syri i Kaltër — Shqipëri", lat: 39.9272, lng: 20.1928, category: "nature" },
  { name: "🏖️ Saranda — Shqipëri", lat: 39.8754, lng: 20.0050, category: "nature" },

  { name: "🌆 Galata Tower — Stamboll", lat: 41.0256, lng: 28.9742, category: "city" },
  { name: "🌆 Bosphorus — Stamboll", lat: 41.0823, lng: 29.0494, category: "city" },
  { name: "🌆 Old Town — Dubrovnik", lat: 42.6403, lng: 18.1083, category: "city" },
  { name: "🌆 Gracia — Barcelonë", lat: 41.4039, lng: 2.1577, category: "city" },
  { name: "🌆 Marais — Paris", lat: 48.8575, lng: 2.3611, category: "city" },
  { name: "🌆 Saint-Germain — Paris", lat: 48.8540, lng: 2.3331, category: "city" },
  { name: "🌆 Notting Hill — Londër", lat: 51.5090, lng: -0.1959, category: "city" },
  { name: "🌆 Camden — Londër", lat: 51.5414, lng: -0.1460, category: "city" },
  { name: "🌆 Plaza de Mayo — Buenos Aires", lat: -34.6083, lng: -58.3712, category: "city" },
  { name: "🌆 La Boca — Buenos Aires", lat: -34.6383, lng: -58.3625, category: "city" },
  { name: "🌆 Old Havana — Kuba", lat: 23.1397, lng: -82.3589, category: "city" },
  { name: "🌆 Fisherman's Wharf — SF", lat: 37.8080, lng: -122.4177, category: "city" },
  { name: "🌃 Roppongi — Tokio", lat: 35.6627, lng: 139.7314, category: "city" },

  // 🌟 Vende të reja turistike (verifikuar në Street View)
  { name: "🏛️ Pergamon Museum — Berlin", lat: 52.5210, lng: 13.3967, category: "world" },
  { name: "🏛️ Anne Frank House — Amsterdam", lat: 52.3752, lng: 4.8840, category: "world" },
  { name: "🏛️ Rijksmuseum — Amsterdam", lat: 52.3600, lng: 4.8852, category: "world" },
  { name: "🏛️ Van Gogh Museum — Amsterdam", lat: 52.3584, lng: 4.8811, category: "world" },
  { name: "🏛️ Manneken Pis — Bruksel", lat: 50.8450, lng: 4.3499, category: "world" },
  { name: "🏛️ Grand Place — Bruksel", lat: 50.8466, lng: 4.3528, category: "world" },
  { name: "🌉 Erasmusbrug — Roterdam", lat: 51.9089, lng: 4.4870, category: "world" },
  { name: "🏛️ Tivoli Gardens — Kopenhagë", lat: 55.6736, lng: 12.5681, category: "world" },
  { name: "🧜 Little Mermaid — Kopenhagë", lat: 55.6929, lng: 12.5993, category: "world" },
  { name: "🏛️ Vasa Museum — Stokholm", lat: 59.3280, lng: 18.0915, category: "world" },
  { name: "🏛️ Gamla Stan — Stokholm", lat: 59.3251, lng: 18.0710, category: "city" },
  { name: "🏛️ Suomenlinna — Helsinki", lat: 60.1453, lng: 24.9881, category: "world" },
  { name: "🏛️ Nyhavn — Kopenhagë", lat: 55.6797, lng: 12.5911, category: "city" },
  { name: "🏞️ Trolltunga — Norvegji", lat: 60.1241, lng: 6.7400, category: "nature" },
  { name: "🏞️ Preikestolen — Norvegji", lat: 58.9864, lng: 6.1900, category: "nature" },
  { name: "🌅 Lofoten — Norvegji", lat: 68.1537, lng: 13.6090, category: "nature" },
  { name: "🌋 Blue Lagoon — Islandë", lat: 63.8804, lng: -22.4495, category: "nature" },
  { name: "💦 Gullfoss — Islandë", lat: 64.3271, lng: -20.1199, category: "nature" },
  { name: "🏛️ Topkapı Palace — Stamboll", lat: 41.0115, lng: 28.9833, category: "world" },
  { name: "🏛️ Dolmabahçe Palace — Stamboll", lat: 41.0391, lng: 29.0001, category: "world" },
  { name: "🏛️ Pamukkale — Turqi", lat: 37.9203, lng: 29.1206, category: "nature" },
  { name: "🏛️ Ephesus — Turqi", lat: 37.9395, lng: 27.3417, category: "world" },
  { name: "🏖️ Antalya Old Town — Turqi", lat: 36.8841, lng: 30.7056, category: "city" },
  { name: "🛕 Tian Tan Buddha — Hong Kong", lat: 22.2540, lng: 113.9050, category: "world" },
  { name: "🛕 Lotus Temple — New Delhi", lat: 28.5535, lng: 77.2588, category: "world" },
  { name: "🛕 Golden Temple — Amritsar", lat: 31.6200, lng: 74.8765, category: "world" },
  { name: "🛕 Gateway of India — Mumbai", lat: 18.9220, lng: 72.8347, category: "world" },
  { name: "🛕 Marina Bay Gardens — Singapor", lat: 1.2816, lng: 103.8636, category: "city" },
  { name: "🌃 Petronas Towers — Kuala Lumpur", lat: 3.1579, lng: 101.7115, category: "world" },
  { name: "🌃 Dotonbori — Osaka", lat: 34.6687, lng: 135.5031, category: "city" },
  { name: "🏯 Osaka Castle", lat: 34.6873, lng: 135.5262, category: "world" },
  { name: "🛕 Todai-ji — Nara", lat: 34.6890, lng: 135.8398, category: "world" },
  { name: "🏖️ Cancún — Meksikë", lat: 21.1619, lng: -86.8515, category: "nature" },
  { name: "🏛️ Chichen Itza — Meksikë", lat: 20.6843, lng: -88.5678, category: "world" },
  { name: "🏖️ Tulum — Meksikë", lat: 20.2114, lng: -87.4654, category: "nature" },
  { name: "🏛️ Teotihuacan — Meksikë", lat: 19.6925, lng: -98.8438, category: "world" },
  { name: "🌆 Wynwood Walls — Miami", lat: 25.8010, lng: -80.1990, category: "city" },
  { name: "🌆 French Quarter — New Orleans", lat: 29.9584, lng: -90.0644, category: "city" },
  { name: "🌃 Pier 39 — San Francisco", lat: 37.8087, lng: -122.4098, category: "city" },
  { name: "🌉 Lombard Street — SF", lat: 37.8021, lng: -122.4187, category: "city" },
  { name: "🌊 Sugarloaf — Rio", lat: -22.9492, lng: -43.1545, category: "nature" },
  { name: "💃 Caminito — Buenos Aires", lat: -34.6388, lng: -58.3625, category: "city" },
  { name: "🏛️ Petra Treasury — Jordani", lat: 30.3286, lng: 35.4517, category: "world" },
  { name: "🌊 Dead Sea — Jordani", lat: 31.5590, lng: 35.4732, category: "nature" },
  { name: "🏖️ Hvar — Kroaci", lat: 43.1729, lng: 16.4413, category: "nature" },
  { name: "🌆 Zagreb Upper Town", lat: 45.8150, lng: 15.9785, category: "city" },
  { name: "🌆 Ljubljana Old Town", lat: 46.0489, lng: 14.5060, category: "city" },
  { name: "🌆 Bratislava Old Town", lat: 48.1442, lng: 17.1097, category: "city" },
  { name: "🌆 Budapest Chain Bridge", lat: 47.4990, lng: 19.0438, category: "world" },
  { name: "🏛️ Hungarian Parliament — Budapest", lat: 47.5072, lng: 19.0457, category: "world" },
  { name: "🌆 Warsaw Old Town", lat: 52.2497, lng: 21.0122, category: "city" },
  { name: "🌆 Krakow Main Square", lat: 50.0617, lng: 19.9373, category: "city" },
  { name: "🏞️ Vlora Riviera — Shqipëri", lat: 40.4686, lng: 19.4886, category: "nature" },
  { name: "🏖️ Himarë — Shqipëri", lat: 40.1023, lng: 19.7444, category: "nature" },
  { name: "🌆 Krujë — Kalaja", lat: 41.5083, lng: 19.7900, category: "city" },
  { name: "🌆 Shkodër — Qendra", lat: 42.0683, lng: 19.5126, category: "city" },
  { name: "🌆 Durrës — Amfiteatri", lat: 41.3120, lng: 19.4500, category: "world" },
  { name: "🌆 Prizren — Qendra", lat: 42.2139, lng: 20.7397, category: "city" },
  { name: "🏞️ Rugova Canyon — Kosovë", lat: 42.6572, lng: 20.2069, category: "nature" },
];

interface Props {
  apiKey: string;
  onTeleport: (lat: number, lng: number, name: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<FamousPlace["category"], string> = {
  islamic: "🕋 Vende të shenjta islame",
  world: "🗼 Monumente botërore",
  nature: "🌄 Natyrë mahnitëse",
  city: "🌆 Qytete të frekuentuara",
};

const CATEGORY_ORDER: FamousPlace["category"][] = ["islamic", "world", "nature", "city"];

function thumbUrl(p: FamousPlace, apiKey: string) {
  const heading = p.heading ?? 0;
  return `https://maps.googleapis.com/maps/api/streetview?size=160x96&location=${p.lat},${p.lng}&fov=90&heading=${heading}&pitch=0&key=${encodeURIComponent(apiKey)}`;
}

export function FamousPlaces({ apiKey, onTeleport, onClose }: Props) {
  const [query, setQuery] = useState("");
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);
  // Map of place name → availability ("ok" = has Street View, "no" = none, undefined = still checking)
  const [availability, setAvailability] = useState<Record<string, "ok" | "no">>({});
  // Cache the resolved nearest panorama coordinates so teleport is instant
  const resolvedCoordsRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (typeof google !== "undefined" && !streetViewServiceRef.current) {
      streetViewServiceRef.current = new google.maps.StreetViewService();
    }
  }, []);

  // Pre-verify every place in the background when the panel opens.
  // Hides locations without Street View coverage (like Mecca/Medina) before the user clicks.
  useEffect(() => {
    const svc = streetViewServiceRef.current;
    if (!svc) return;
    let cancelled = false;

    const checkOne = (place: FamousPlace) =>
      new Promise<void>((resolve) => {
        svc.getPanorama(
          {
            location: { lat: place.lat, lng: place.lng },
            radius: 250,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data, status) => {
            if (cancelled) return resolve();
            if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
              resolvedCoordsRef.current[place.name] = {
                lat: data.location.latLng.lat(),
                lng: data.location.latLng.lng(),
              };
              setAvailability((prev) => ({ ...prev, [place.name]: "ok" }));
            } else {
              setAvailability((prev) => ({ ...prev, [place.name]: "no" }));
            }
            resolve();
          },
        );
      });

    // Check in small batches to avoid hammering the Street View API
    const run = async () => {
      const BATCH_SIZE = 8;
      for (let i = 0; i < FAMOUS_PLACES.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = FAMOUS_PLACES.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(checkOne));
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    // Show only places that are still being checked OR confirmed available.
    // Hide places explicitly marked unavailable so the user never clicks a dead one.
    const base = FAMOUS_PLACES.filter((p) => availability[p.name] !== "no");
    if (!normalizedQuery) return base;
    return base.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, availability]);

  const handleSelectPlace = (place: FamousPlace) => {
    // Use the pre-resolved nearest panorama coords if available
    const cached = resolvedCoordsRef.current[place.name];
    if (cached) {
      onTeleport(cached.lat, cached.lng, place.name);
      return;
    }
    // Fall back to the raw coords (place is still being verified)
    onTeleport(place.lat, place.lng, place.name);
  };

  return (
    <div className="fixed top-20 right-4 bottom-4 w-96 z-20 glass-panel rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Vende të famshme</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-3 py-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kërko vend..."
            className="pl-9 h-9 bg-card/40 border-border/40"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">
          {CATEGORY_ORDER.map((cat) => {
            const items = filtered.filter((p) => p.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {CATEGORY_LABELS[cat]}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPlace(p)}
                      disabled={checkingPlace !== null}
                      className="group text-left rounded-lg overflow-hidden bg-card/40 hover:bg-accent/50 border border-border/40 transition-all hover:border-primary/40"
                    >
                      <div className="aspect-[5/3] bg-muted overflow-hidden">
                        <img
                          src={thumbUrl(p, apiKey)}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium leading-tight line-clamp-2">{p.name}</p>
                        {checkingPlace === p.name && (
                          <p className="mt-1 text-[11px] text-muted-foreground">Po kontrollohet...</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Asnjë rezultat për "{query}"
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
