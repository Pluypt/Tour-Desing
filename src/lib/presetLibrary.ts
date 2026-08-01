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

  // CHENGDU CHINA
  {
    city: "Chengdu",
    country: "China",
    category: "Attraction",
    title: "ศูนย์อนุรักษ์หมีแพนด้าเฉิงตู (Chengdu Panda Base)",
    description: "นำท่านเยี่ยมชม **ศูนย์อนุรักษ์หมีแพนด้าเฉิงตู** ชมความน่ารักของหมีแพนด้ายักษ์และแพนด้าแดงในบรรยากาศป่าไผ่ธรรมชาติอันร่มรื่น",
    recommendedTime: "เช้า"
  },
  {
    city: "Chengdu",
    country: "China",
    category: "Attraction",
    title: "ถนนโบราณจิ๋นหลี่ (Jinli Ancient Street)",
    description: "สัมผัสบรรยากาศย่านเมืองเก่าสามก๊ก **ถนนโบราณจิ๋นหลี่** ชมโคมไฟสไตล์โบราณ ชิมหมาล่าเสียบไม้ และของกินพื้นเมืองเสฉวน",
    recommendedTime: "เย็น"
  },
  {
    city: "Chengdu",
    country: "China",
    category: "Hotel",
    title: "Chengdu Holiday Inn Express / Shangri-La Chengdu",
    description: "โรงแรมระดับ 4-5 ดาว สไตล์โมเดิร์น สัมผัสความสบายระดับพรีเมียม",
  }
];
