export type POIPreset = {
  city: string;
  country: string;
  category: "Attraction" | "Dining" | "Hotel" | "Shopping";
  title: string;
  description: string;
  recommendedTime?: string;
};

export const POI_PRESETS: POIPreset[] = [
  // MACAO & HONG KONG
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "โบสถ์เซนต์พอล (Ruins of St. Paul's)",
    description: "นำท่านถ่ายภาพ **โบสถ์เซนต์พอล (Ruins of St. Paul's)** หรือที่ชาวมาเก๊าเรียกว่า 'ต้าซานปา' ซากโบสถ์คริสต์สถาปัตยกรรมตะวันตกผสมผสานสัญลักษณ์ทางศาสนาพุทธ ถือเป็นแลนด์มาร์กอันดับหนึ่งของมาเก๊า",
    recommendedTime: "เช้า | บ่าย"
  },
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "เซนาโด้สแควร์ (Senado Square)",
    description: "นำท่านสู่ **เซนาโด้สแควร์ (Senado Square)** จัตุรัสใจกลางเมืองมาเก๊าที่ถูกล้อมรอบด้วยตึกสไตล์ยุโรป มรดกโลก UNESCO เพลิดเพลินกับการเลือกซื้อของฝากและร้านขนมพื้นเมืองมาเก๊า",
    recommendedTime: "บ่าย"
  },
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "เจ้าแม่กวนอิมริมทะเล (Kun Iam Ecumenical Centre)",
    description: "นำท่านถ่ายรูปกับ **เจ้าแม่กวนอิมริมทะเล** รูปปั้นเจ้าแม่กวนอิมปรางทองยืนบนดอกบัวริมทะเล แลนด์มาร์กศักดิ์สิทธิ์ที่ผสานงานปั้นสไตล์ยุโรปและจีนอย่างลงตัว",
    recommendedTime: "เย็น"
  },
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "เดอะเวเนเชี่ยน มาเก๊า (The Venetian Macao)",
    description: "นำท่านชมความอลังการของ **เดอะเวเนเชี่ยน มาเก๊า (The Venetian Macao)** รีสอร์ทคาสิโนสไตล์เวนิสจำลอง ล่องเรือกอนโดล่าในคลองจำลอง indoor ช้อปปิ้งแบรนด์เนมชั้นนำ",
    recommendedTime: "บ่าย | เย็น"
  },
  {
    city: "Macao",
    country: "Macao",
    category: "Hotel",
    title: "The Kowloon Hotel / Venetian Macao",
    description: "โรงแรมระดับ 4-5 ดาว ใจกลางย่านท่องเที่ยว สะดวกสบาย พร้อมสิ่งอำนวยความสะดวกครบครัน",
  },

  // HONG KONG
  {
    city: "Hong Kong",
    country: "Hong Kong",
    category: "Attraction",
    title: "วัดแชกงหมิว (Che Kung Temple / วัดกังหัน)",
    description: "นำท่านไหว้พระขอพร **วัดแชกงหมิว (วัดกังหันนำโชค)** หมุนกังหันพัดพาโชคลาภ สิ่งอัปมงคลออกไป และนำพาความสุขความเจริญเข้ามาในชีวิต",
    recommendedTime: "เช้า"
  },
  {
    city: "Hong Kong",
    country: "Hong Kong",
    category: "Attraction",
    title: "วัดหวังต้าเซียน (Wong Tai Sin Temple)",
    description: "นำท่านสักการะ **วัดหวังต้าเซียน** วัดชื่อดังที่มีชื่อเสียงด้านการผูกด้ายแดงขอพรเรื่องความรัก และการสุ่มเซียมซีที่แม่นยำที่สุดในฮ่องกง",
    recommendedTime: "เช้า | บ่าย"
  },
  {
    city: "Hong Kong",
    country: "Hong Kong",
    category: "Attraction",
    title: "หาดรีพัลส์เบย์ & เจ้าแม่กวนอิมอ่องฮ่ำ",
    description: "นำท่านสู่ **อ่าวรีพัลส์เบย์ (Repulse Bay)** อธิษฐานขอพร **เจ้าแม่กวนอิมอ่องฮ่ำ** ข้ามสะพานสีแดงต่ออายุ และโยนเหรียญเข้าปากปลาโชคลาภ",
    recommendedTime: "เช้า"
  },

  // TOKYO JAPAN
  {
    city: "Tokyo",
    country: "Japan",
    category: "Attraction",
    title: "วัดเซ็นโซจิ อาซากุสะ (Sensoji Temple Asakusa)",
    description: "นำท่านชม **วัดเซ็นโซจิ (Sensoji Temple)** หรือวัดอาซากุสะ ถ่ายภาพกับโคมแดงยักษ์ ถนนช้อปปิ้งนากามิเสะ ซื้อของฝากและขนมญี่ปุ่นโบราณ",
    recommendedTime: "เช้า"
  },
  {
    city: "Tokyo",
    country: "Japan",
    category: "Shopping",
    title: "ย่านชินจูกุ (Shinjuku Shopping District)",
    description: "อิสระช้อปปิ้ง **ย่านชินจูกุ (Shinjuku)** ย่านการค้าคึกคักที่สุดของโตเกียว ช้อปสินค้าแบรนด์เนม เสื้อผ้า เครื่องสำอาง และถ่ายรูปหน้าจอ 3D ยักษ์แมวเหมียว",
    recommendedTime: "บ่าย | เย็น"
  },
  {
    city: "Tokyo",
    country: "Japan",
    category: "Hotel",
    title: "Shinagawa Prince Hotel / Shinjuku Washington Hotel",
    description: "โรงแรมระดับ 4 ดาว ย่านศูนย์กลางโตเกียว เดินทางสะดวกใกล้สถานีรถไฟใหญ่",
  },

  // MACAO & HONG KONG (TRENDY LANDMARKS)
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "เดอะลอนดอนเนอร์ มาเก๊า (The Londoner Macao) มุมถ่ายรูปบิ๊กเบนจำลอง",
    description: "นำท่านถ่ายภาพมุมไวรัลยอดฮิต **The Londoner Macao** สถาปัตยกรรมสไตล์อังกฤษสุดหรู หอนาฬิกาบิ๊กเบน และตู้โทรศัพท์สีแดงสุดคลาสสิก",
    recommendedTime: "บ่าย | เย็น"
  },
  {
    city: "Macao",
    country: "Macao",
    category: "Attraction",
    title: "หมู่บ้านไทปา (Taipa Village) ตึกพาสเทล & คาเฟ่สุดชิค",
    description: "เดินเล่น **หมู่บ้านไทปา (Taipa Village)** ถ่ายรูปตรอกซอกซอยตึกโคโลเนียลสีพาสเทล ชิมทาร์ตไข่ Lord Stow's และแวะคาเฟ่สไตล์มินิมอล",
    recommendedTime: "บ่าย"
  },
  {
    city: "Hong Kong",
    country: "Hong Kong",
    category: "Attraction",
    title: "West Kowloon Art Park & พิพิธภัณฑ์ M+ จุดชมวิวริมอ่าวสุด Aesthetic",
    description: "นำท่านเช็คอินแลนด์มาร์กศิลปะริมน้ำ **West Kowloon Art Park** นั่งปิคนิคชมวิวอ่าววิคตอเรีย และถ่ายรูปสถาปัตยกรรมสุดมินิมอล ณ **พิพิธภัณฑ์ M+**",
    recommendedTime: "เย็น"
  },
  {
    city: "Hong Kong",
    country: "Hong Kong",
    category: "Shopping",
    title: "K11 MUSEA ห้างศิลปะริมอ่าว & จุดเช็คอินแลนด์มาร์กดัง",
    description: "เดินเล่น **K11 MUSEA** ศูนย์การค้าริมอ่าวที่ผสานศิลปะและแฟชั่นระดับโลก ถ่ายรูปมุมบันไดวน The Oculus สุดอลังการ",
    recommendedTime: "บ่าย | เย็น"
  },

  // TOKYO JAPAN (TRENDY LANDMARKS)
  {
    city: "Tokyo",
    country: "Japan",
    category: "Attraction",
    title: "จุดชมวิวพาโนรามา Shibuya Sky (Shibuya Scramble Square)",
    description: "ขึ้นชมวิวมหานครโตเกียวแบบ 360 องศาบนดาดฟ้ากระจกใส **Shibuya Sky** จุดถ่ายรูปพาโนรามาสุดไวรัลอันดับ 1 มองเห็นวิวภูเขาไฟฟูจิและห้าแยกชิบูย่า",
    recommendedTime: "เย็น | ค่ำ"
  },
  {
    city: "Tokyo",
    country: "Japan",
    category: "Attraction",
    title: "โอโมเตะซันโด & Cat Street คาเฟ่ฮอปปิ้ง & แฟชั่นสตรีท",
    description: "เดินเล่นย่านสถาปัตยกรรมระดับโลก **Omotesando** และถนนสายแฟชั่น **Cat Street** แวะจิบกาแฟในคาเฟ่ดีไซน์ชิค",
    recommendedTime: "บ่าย"
  },

  // CHENGDU & CHONGQING (TRENDY LANDMARKS)
  {
    city: "Chengdu",
    country: "China",
    category: "Attraction",
    title: "หมีแพนด้ายักษ์ปีนตึก IFS Chengdu & ไท่กู่หลี่ (Taikoo Li)",
    description: "ถ่ายรูปกับ **ประติมากรรมหมีแพนด้ายักษ์ปีนตึก IFS** แลนด์มาร์กอันดับหนึ่งของเฉิงตู และช้อปปิ้งย่านโมเดิร์น **ไท่กู่หลี่ (Taikoo Li)**",
    recommendedTime: "บ่าย"
  },
  {
    city: "Chongqing",
    country: "China",
    category: "Attraction",
    title: "หงหยาต้ง (Hongyadong) แสงสีทองเมืองไซเบอร์พังก์ยามค่ำคืน",
    description: "ชมความงามตระการตาของ **หงหยาต้ง (Hongyadong)** อาคารไม้โบราณ 11 ชั้นริมหน้าผาเปิดไฟสีทองสว่างไสว ดุจหลุดเข้าไปในโลกแอนิเมชัน Spirited Away",
    recommendedTime: "ค่ำ"
  },
  {
    city: "Chongqing",
    country: "China",
    category: "Attraction",
    title: "สถานีรถไฟหลี่จื่อป้า (Liziba Station) รถไฟโมโนเรลวิ่งทะลุตึก",
    description: "นำท่านถ่ายรูปจุดไวรัลระดับโลก **รถไฟโมโนเรลวิ่งทะลุตึกอพาร์ตเมนต์สถานีหลี่จื่อป้า** สัมผัสความมหัศจรรย์ของเมือง 3 มิติ",
    recommendedTime: "เช้า | บ่าย"
  },

  // KUNMING & YUNNAN (TRENDY LANDMARKS)
  {
    city: "Kunming",
    country: "China",
    category: "Attraction",
    title: "ตลาดดอกไม้สดโต่วหนาน (Dounan Flower Market) ทะเลดอกไม้สุดอลังการ",
    description: "สัมผัสบรรยากาศ **ตลาดดอกไม้โต่วหนาน** ตลาดดอกไม้สดที่ใหญ่ที่สุดในเอเชีย สวรรค์ของสายคอนเทนต์และคนรักดอกไม้ ถ่ายรูปมุมสดใสสไตล์มินิมอล",
    recommendedTime: "เย็น | ค่ำ"
  },
  {
    city: "Kunming",
    country: "China",
    category: "Attraction",
    title: "ซุ้มประตูม้าทองไก่หยก & ถนนคนเดินหนานผิง (Nanping Street)",
    description: "ถ่ายรูปคู่กับ **ซุ้มประตูม้าทองไก่หยก** แลนด์มาร์กประวัติศาสตร์ใจกลางเมือง และเดินชิลล์ **ถนนคนเดินหนานผิง** ลิ้มลองสตรีทฟู้ดและชานมไข่มุกยูนนาน",
    recommendedTime: "เย็น"
  }
];

