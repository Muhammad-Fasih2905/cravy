/** Genuine customer reviews from the Cravy Google Business Profile, shown verbatim as supplied by the owner.
 *  Add or remove entries here. Do not edit the wording of a review. */
export type Review = { name: string; profileUrl: string; meta: string; text: string };

const p = (id: string) => `https://www.google.com/maps/contrib/${id}/reviews?hl=en-GB`;

export const REVIEWS: Review[] = [
  { name: "Food club Karachi", profileUrl: p("104522691484999210992"), meta: "Local Guide · 151 reviews · 904 photos",
    text: "Cravy at rashid Minhas road serving best shakes and the full loaded wafffle so reasonable so delicious with 4 different scooped of ice cream this is something you need to try it out" },
  { name: "Kawishali Ali", profileUrl: p("104606913101180226110"), meta: "1 review · 1 photo",
    text: "The ice cream and shakes here are absolutely delicious—fresh, creamy, and full of flavor🍦\nAmazing taste, great quality, and definitely a place I’d recommend to everyone ❤️🍨" },
  { name: "Syed Aamir Ali", profileUrl: p("116485076229868759531"), meta: "Local Guide · 159 reviews · 892 photos",
    text: "Awesome and intriguing flavours with mind blowing tastes. I really enjoyed everytime I visit with my family." },
  { name: "Laiba Sabah", profileUrl: p("117960595124505164856"), meta: "1 review",
    text: "5 outta 5 as mojito was soo good with perfect balance of minty and berry taste" },
  { name: "Jameel Ahmed", profileUrl: p("109353476142452612043"), meta: "3 reviews · 5 photos",
    text: "Good abd respectful Staff\nThe Ambiance was so good and the sodas were way better than i even thought" },
  { name: "Rabia Aamir", profileUrl: p("107707435499919939638"), meta: "Local Guide · 14 reviews · 1 photo",
    text: "Great experience taste was awesome and price are reasonable😎😎" },
  { name: "Sami Warsi", profileUrl: p("113700061912238482533"), meta: "8 reviews · 22 photos", text: "Nice variety of flavours" },
  { name: "ABDUL REHMAN", profileUrl: p("109944185551658597887"), meta: "5 reviews · 13 photos", text: "Good ambiance good taste" },
];
