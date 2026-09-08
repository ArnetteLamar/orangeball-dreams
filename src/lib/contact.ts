export const contactConfig = {
  agencyEmail: "luchofer11@hotmail.com",
  platformEmail: "arnettehallman@gmail.com",
  psychologyEmail: "Miguelsapsychology@gmail.com",

  agencySubject: "Orangeball Dreams",
  platformSubject: "Orangeball Dreams Feedback",
  psychologySubject: "Orangeball Dreams Psychology Support",

  // Trocar no futuro por email profissional:
  // contact@orangeballdreams.com
  // psychology@orangeballdreams.com

  bookingUrl: "",
  agencyTeamsUrl:
    "https://teams.microsoft.com/l/chat/0/0?users=luchofer11@hotmail.com",
  psychologyTeamsUrl:
    "https://teams.microsoft.com/l/chat/0/0?users=Miguelsapsychology@gmail.com",
};

export function createMailto(email: string, subject: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
