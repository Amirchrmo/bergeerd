/**
 * Offline copy of the default (Ardabil) branch. The site root renders it
 * instantly while the API loads and keeps showing it if the API cannot be
 * reached, so a scanned QR code always opens a menu. Branch details mirror
 * seeder.DefaultBranch in bergeerd_api.
 */
import type { BranchMenu, MenuItem } from "./types";
import classicBurger from "@/assets/real-classic.jpg";
import karamel from "@/assets/real-karamel.jpg";
import spoicy from "@/assets/real-spoicy.jpg";
import chiz from "@/assets/real-chiz.jpg";
import mash from "@/assets/real-mashroom.jpg";
import doody from "@/assets/real-doody.jpg";
import mahali from "@/assets/real-mahali.jpg";
import beyken from "@/assets/real-beyken.jpg";
import chiken from "@/assets/real-chiken.jpg";

import friesImage from "@/assets/sibzamini.jpg";
import topImage from "@/assets/top.png";
import cola from "@/assets/cola.jpg";
import fanta from "@/assets/fanta.png";

const burgers: MenuItem[] = [
  {
    id: "classic-burger",
    name: "کلاسیک برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با کاهو تازه،پیاز، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.",
    price: "۵۹۰",
    image: classicBurger,
    imageAlt: "برگر کلاسیک با مخلفات تازه",
  },
  {
    id: "caramel-burger",
    name: "کارامل برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با پیاز کاراملی، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.",
    price: "۶۶۰",
    image: karamel,
    imageAlt: "برگر کارامل با مخلفات تازه",
  },
  {
    id: "spoysi-burger",
    name: "اسپایسی برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با هالوپینو تند، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.",
    price: "۶۴۰",
    image: spoicy,
    imageAlt: "برگر کارامل با مخلفات تازه",
  },
  {
    id: "cheese-burger",
    name: "چیز برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با دو ورق پنیر چدار ذوب شده، کاهو تازه، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.",
    price: "۶۶۰",
    image: chiz,
    imageAlt: "چیزبرگر با پنیر ذوب شده",
  },
  {
    id: "mushroom-burger",
    name: "ماشروم برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با سس قارچ، کاهو تازه، گوجه،خیارشور و پیازچه روی نان کره ای به همراه سیب زمینی.",
    price: "۶۹۰",
    image: mash,
    imageAlt: "ماشروم برگر با قارچ تازه",
  },
  {
    id: "smoky-burger",
    name: "دودی برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با دو ورق پنیر دودی، کاهو تازه،پاپریکای کبابی، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی.",
    price: "۶۹۰",
    image: doody,
    imageAlt: "برگر دودی با طعم باربیکیو",
  },
  {
    id: "local-burger",
    name: "محلی برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با پنیر لیقوان، ریحان تازه، گوجه و سس سیر روی نان کره ای به همراه سیب زمینی.",
    price: "۶۶۰",
    image: mahali,
    imageAlt: "برگر محلی با مواد محلی",
  },
  {
    id: "bacon-burger",
    name: "بیکن برگرد",
    description:
      "۱۳۰ گرم گوشت گوساله آبدار با بیکن دودی، کاهو تازه،پیاز، گوجه، خیارشور و سس برگرد روی نان کره ای به همراه سیب زمینی",
    price: "۷۲۰",
    image: beyken,
    imageAlt: "برگر بیکن دودی",
  },
];

const sandwiches: MenuItem[] = [
  {
    id: "chicken-sandwich",
    name: "ساندویچ مرغ",
    description:
      "۱۲۰ گرم فیله مرغ با خیار، گوجه، ریحان تازه، و سس انبه و چیلی روی نان چاپاتا کره ای به همراه سیب زمینی.",
    price: "۵۲۰",
    image: chiken,
    imageAlt: "ساندویچ مرغ",
  },
];

const fries: MenuItem[] = [
  {
    id: "classic-fries",
    name: "سیب زمینی",
    description: "سیب‌زمینی طلایی و ترد با ادویه برگرد.",
    price: "۲۶۰",
    image: friesImage,
    imageAlt: "سیب‌زمینی طلایی ترد",
  },
];
const toppings: MenuItem[] = [
  {
    id: "classic-topping",
    name: "گوشت ۶۵ گرمی اضافه",
    description: "",
    price: "۱۴۰",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "بیکن",
    description: "",
    price: "۱۲۰",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "پیاز کاراملی",
    description: "",
    price: "۶۰",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "قارچ",
    description: "",
    price: "۶۰",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "هالوپینو",
    description: "",
    price: "۵۰",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "پنیر دودی",
    description: "",
    price: "۵۵",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "پنیر چدار",
    description: "",
    price: "۵۵",
    image: topImage,
    imageAlt: "تاپینگ اضافه",
  },
  {
    id: "classic-topping",
    name: "سس سیر",
    description: "",
    price: "۵۰",
    image: topImage,
    imageAlt: "سس سیر",
  },
  {
    id: "classic-topping",
    name: "سس هالوپینو",
    description: "",
    price: "۵۰",
    image: topImage,
    imageAlt: "سس هالوپینو",
  },
  {
    id: "classic-topping",
    name: "سس دودی",
    description: "",
    price: "۷۰",
    image: topImage,
    imageAlt: "سس دودی",
  },
  {
    id: "classic-topping",
    name: "سس چیلی انبه",
    description: "",
    price: "۶۰",
    image: topImage,
    imageAlt: "سس چیلی انبه",
  },
  
];

const drinks: MenuItem[] = [
  {
    id: "classic-cola",
    name: "کولا",
    description: "کولا با یخ.",
    price: "۸۵",
    image: cola,
    imageAlt: "کولا خنک‌کننده با یخ",
  },
  {
    id: "zero-cola",
    name: "زیرو",
    description: "کولا زیرو بدون قند با یخ.",
    price: "۸۵",
    image: cola,
    imageAlt: "کولا زیرو بدون قند",
  },
  {
    id: "fanta",
    name: "فانتا",
    description: "نوشابه پرتغالی به همراه یخ",
    price: "۸۵",
    image: fanta,
    imageAlt: "نوشابه پرتغالی تازه و خنک",
  },
];

export const FALLBACK_MENU: BranchMenu = {
  branch: {
    slug: "ardabil",
    name: "اردبیل",
    theme: "ember",
    isDefault: true,
    address: "اردبیل، پارک شهریار",
    phone: "+98 919 399 8029",
    hours: "هر روز ۱۲ تا ۱۵ : ۱۱",
    mapUrl: "https://maps.app.goo.gl/SuFQPrsjuxGb5SuD6",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d302.68466979882555!2d48.2776719!3d38.239354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4018976cca86421b%3A0xebf6da6d1445251e!2sBergeerd%20%7C%20%D8%A8%D8%B1%DA%AF%D8%B1%D8%AF%E2%80%AD!5e1!3m2!1sen!2s!4v1732873870000!5m2!1sen!2s",
    instagram: "bergeerd",
  },
  sections: [
    { category: "burgers", title: "برگرها", order: 1, items: burgers },
    { category: "sandwiches", title: "ساندویچ‌ها", order: 2, items: sandwiches },
    { category: "fries", title: "سیب‌زمینی", order: 3, items: fries },
    { category: "toppings", title: "میتونی اضافه کنی...", order: 4, items: toppings },
    { category: "drinks", title: "نوشیدنی‌ها", order: 5, items: drinks },
  ],
};
