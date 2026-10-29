// ---------- CONFIG: paste your real Razorpay Payment Page/Link URLs here ----------
const RAZORPAY_LINKS = {
  stories: "https://rzp.io/l/PASTE-YOUR-STORIES-LINK",
  experience: "https://rzp.io/l/PASTE-YOUR-EXPERIENCE-LINK",
  ebookWasThatLove: "https://rzp.io/rzp/xuC5BcP",
  ebookCoincidence: "https://rzp.io/rzp/dh78raYc",
  ebookLoveYourselfFirst: "https://rzp.io/rzp/Ra1Myen",
  ebookHealingAfterHeartbreak: "https://rzp.io/rzp/k4L1DvGT",
  ebookDearMe: "https://rzp.io/rzp/CnVMKw7I",
  ebookTextMeBack: "https://rzp.io/rzp/7bQdoLCD",
  ebookRedFlagsGreenFlags: "https://rzp.io/rzp/KUMn3GV",
  ebookLettersINeverSent: "https://rzp.io/rzp/L5AUD4Mg",
  ebookMilesApart: "https://rzp.io/rzp/mikOQkT",
  ebookStoriesWeNeverTold: "https://rzp.io/rzp/wNLnwfk",
  bundleAll: "https://rzp.io/rzp/yl5ewD1N",
  ebookClaudeMadeSimple: "https://rzp.io/rzp/tWJtfLT",
  ebookPromptLikeAPro: "https://rzp.io/rzp/MAuucPQ",
  ebookAIEverydayLife: "https://rzp.io/rzp/vZtENQRb",
  ebookAutomateIt: "https://rzp.io/rzp/AQzptkg",
  ebookTeachClaudeSkills: "https://rzp.io/rzp/f8WrXEl9",
  ebookAIStudentsJobs: "https://rzp.io/rzp/4PnyQ5K",
  ebookAIInstagramBusiness: "https://rzp.io/rzp/vgr0ZKK",
  bundleAI: "https://rzp.io/rzp/MtK0XwVK"
};
document.querySelectorAll('[data-razorpay]').forEach(el => {
  const key = el.getAttribute('data-razorpay');
  if (RAZORPAY_LINKS[key]) el.href = RAZORPAY_LINKS[key];
});

// ---------- SERVICES: "Enquire" pre-fills the enquiry form ----------
const enquiryService = document.getElementById('enquiry-service');
const enquiryPackage = document.getElementById('enquiry-package');
document.querySelectorAll('[data-enquire]').forEach(btn => {
  btn.addEventListener('click', () => {
    const [service, pkg] = btn.dataset.enquire.split('|');
    enquiryService.value = service;
    enquiryPackage.value = pkg;
    document.getElementById('enquiry').scrollIntoView({behavior:'smooth'});
  });
});

