export interface Update {
  id: string;
  title: string;
  image: string;
  summary: string;
  details: string;
  date: string;
}

export const updates: Update[] = [
  {
    id: "1",
    title: "Venue Selected!",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
    summary: "We have officially booked our dream venue.",
    details: "After visiting 5 different locations, we fell in love with the Grand Garden Estate. It has the perfect mix of indoor elegance and outdoor charm that we were looking for. The ceremony will be held in the rose garden, followed by a reception in the main hall.",
    date: "2025-10-15"
  },
  {
    id: "2",
    title: "Engagement Photos",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop",
    summary: "Our engagement photoshoot was a blast!",
    details: "We spent the afternoon with our photographer at the beach. The sunset was incredible, and we can't wait to share the full gallery with you all. Here is a sneak peek of our favorite shot.",
    date: "2025-11-20"
  },
  {
    id: "3",
    title: "Save the Dates Sent",
    image: "https://images.unsplash.com/photo-1529636721198-603609035b0f?q=80&w=2000&auto=format&fit=crop",
    summary: "Check your mailboxes!",
    details: "We've just mailed out our official Save the Dates. We hope you can join us on our special day. Please let us know if you haven't received yours by the end of the month.",
    date: "2026-01-10"
  }
];
