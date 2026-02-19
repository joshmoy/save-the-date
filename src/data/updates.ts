export interface Update {
  id: string;
  title: string;
  image: string;
  videoUrl?: string;
  summary: string;
  details: string;
  date: string;
  pageRoute: string;
}

export const updates: Update[] = [
  {
    id: "1",
    title: "Reception Venue Selected!",
    image:
      "https://res.cloudinary.com/difnldi4c/image/upload/v1771507942/ibrahim-boran-m8YjB0noWiY-unsplash_ftqzdj.jpg",
    summary: "We have officially booked our dream venue.",
    details:
      "Dream venue you say? After visiting different locations and hearing different prices, we fell in love with the Sheba Center located in Maryland, Lagos. It has the perfect mix of indoor space and outdoor charm (adequate parking) that we were looking for.",
    date: "2026-02-01",
    pageRoute: "/updates/venue-selected",
  },
  {
    id: "2",
    title: "Engagement Video",
    image: "https://res.cloudinary.com/difnldi4c/image/upload/v1771340296/7V2A8730_kypxhl.jpg",
    summary: "Relive our engagement!",
    details:
      "Did I just hear Muah? Anyway, we spent the evening at Black Pepper, Lagos. The atmosphere was incredible, and we can't wait to share the full gallery with you all. Here is a sneak peek of how it went down. Please watch in 1080p for the best quality.",
    date: "2024-01-13",
    pageRoute: "/updates/engagement-video",
  },
  {
    id: "3",
    title: "Official Colors Revealed",
    image: "https://res.cloudinary.com/difnldi4c/image/upload/v1771340247/7V2A8669_kmjtbz.jpg",
    summary: "The colors of our wedding!",
    details:
      "We have chosen our official colors for the wedding. For the engagement ceremony, we will rock burgundy while the bride's friends will wear pink and the groom's friends will be in white agbada and dusky pink caps.",
    date: "2026-02-01",
    pageRoute: "/updates/official-colors",
  },
  // {
  //   id: "4",
  //   title: "Vendor Gist",
  //   image:
  //     "https://res.cloudinary.com/difnldi4c/image/upload/v1771507690/andra-c-taylor-jr-soJBvazDKL0-unsplash_dciyyp.jpg",
  //   summary: "Our vendors for the wedding!",
  //   details:
  //     "We've chosen our vendors for the wedding. We're excited to work with them to make our day special.",
  //   date: "2026-02-01",
  //   pageRoute: "/updates/vendors",
  // },
  {
    id: "5",
    title: "Gifting",
    image:
      "https://res.cloudinary.com/difnldi4c/image/upload/v1771507844/nina-mercado-CnrDuY0tFrg-unsplash_bwnkii.jpg",
    summary: "Gifting for the wedding!",
    details:
      "We know how much you love us, and we want to help you make gifting easier (in case you're shy). We will be provide the magic button to send your gifts in a bit.",
    date: "2026-02-01",
    pageRoute: "/updates/gifting",
  },
];
