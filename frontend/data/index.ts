// Navigation items used in header or landing sections
export const navItems = [
  { name: "Home", link: "/" },
  { name: "Interview", link: "#Form" },
  { name: "About", link: "#about" },
  { name: "Contact", link: "#learn" },
];



export const socialMedia = [

  {
    id: "github",
    img: "/git.svg",
    url: "https://github.com/icebear-py",
  },
  {
    id: "linkedin",
    img: "/link.svg",
    url: "https://linkedin.com/in/yourprofile",
  },
];


export const workExperience = [
  {
    id: 1,
    title: "Full Stack Developer - JSM Tech",
    desc: "Assisted in the development of a web-based platform using React.js, enhancing interactivity.",
    className: "md:col-span-2",
    thumbnail: "/exp1.svg",
  },
  {
    id: 2,
    title: "Mobile App Dev - JSM Tech",
    desc: "Designed and developed mobile app for both iOS & Android platforms using React Native.",
    className: "md:col-span-2", // change to md:col-span-2
    thumbnail: "/exp2.svg",
  },
  {
    id: 3,
    title: "Freelance App Dev Project",
    desc: "Led the dev of a mobile app for a client, from initial concept to deployment on app stores.",
    className: "md:col-span-2", // change to md:col-span-2
    thumbnail: "/exp3.svg",
  },
  {
    id: 4,
    title: "Lead Frontend Developer",
    desc: "Developed and maintained user-facing features using modern frontend technologies.",
    className: "md:col-span-2",
    thumbnail: "/exp4.svg",
  },
];

// Grid section content — keep only if your homepage uses a grid layout
export const gridItems = [
  {
    id: 1,
    title: "Practice Real-Time AI Interviews",
    description: "Train with AI to prepare for real-world scenarios",
    className: "lg:col-span-3 md:col-span-6 md:row-span-4 lg:min-h-[60vh]",
    imgClassName: "w-full h-full",
    titleClassName: "justify-end",
    img: "/b1.svg",
    spareImg: "",
  },
  {
    id: 2,
    title: "Track Your Progress",
    description: "Visual feedback and improvement suggestions",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
];

