// Fictional listings for demonstration only.
// "Local" is defined as Chandigarh / Mohali in this prototype.

const internships = [
  {
    id: 1,
    role: "Web Development Intern",
    company: "Demo Company A",
    stipend: 6000,
    mode: "remote",
    location: "Remote",
    skills: ["HTML", "CSS", "JavaScript"],
    duration: "8 weeks",
    hours: "15 hours per week",
    description:
      "Build responsive web pages and improve website usability with guidance from a developer."
  },
  {
    id: 2,
    role: "Graphic Design Intern",
    company: "Demo Company B",
    stipend: 4000,
    mode: "local",
    location: "Chandigarh",
    skills: ["Canva", "Graphic Design"],
    duration: "6 weeks",
    hours: "12 hours per week",
    description:
      "Create posters and social media graphics, and receive weekly feedback from a design mentor."
  },
  {
    id: 3,
    role: "Community Outreach Intern",
    company: "Demo Organisation C",
    stipend: 0,
    mode: "local",
    location: "Mohali",
    skills: ["Communication", "Event Planning"],
    duration: "4 weeks",
    hours: "8 hours per week",
    description:
      "Help plan community activities and prepare outreach materials alongside a programme coordinator."
  },
  {
    id: 4,
    role: "Data Analysis Intern",
    company: "Demo Company D",
    stipend: 7000,
    mode: "remote",
    location: "Remote",
    skills: ["Excel", "Python"],
    duration: "8 weeks",
    hours: "15 hours per week",
    description:
      "Clean sample datasets, create charts and explain findings with support from an analyst."
  },
  {
    id: 5,
    role: "Content Writing Intern",
    company: "Demo Organisation E",
    stipend: 0,
    mode: "remote",
    location: "Remote",
    skills: ["Writing", "Research"],
    duration: "4 weeks",
    hours: "6 hours per week",
    description:
      "Research educational topics and draft short articles with feedback from an editor."
  }
];

const payFilter = document.getElementById("payFilter");
const modeFilter = document.getElementById("modeFilter");
const skillFilter = document.getElementById("skillFilter");
const internshipList = document.getElementById("internshipList");
const resultCount = document.getElementById("resultCount");
const emptyMessage = document.getElementById("emptyMessage");
const dialog = document.getElementById("detailsDialog");

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function stipendText(amount) {
  return amount > 0 ? `${currency.format(amount)} / month` : "Unpaid";
}

// Populate the skill filter from the listing data.
const allSkills = [...new Set(
  internships.flatMap(internship => internship.skills)
)].sort();

allSkills.forEach(skill => {
  const option = document.createElement("option");
  option.value = skill;
  option.textContent = skill;
  skillFilter.appendChild(option);
});

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createTags(skills) {
  const tags = document.createElement("div");
  tags.className = "tags";

  skills.forEach(skill => {
    tags.appendChild(makeElement("span", "tag", skill));
  });

  return tags;
}

function showDetails(internship) {
  document.getElementById("detailsTitle").textContent = internship.role;
  document.getElementById("detailsCompany").textContent = internship.company;
  document.getElementById("detailsDescription").textContent =
    internship.description;

  const facts = document.getElementById("detailsFacts");
  facts.replaceChildren();

  const information = [
    ["Stipend", stipendText(internship.stipend)],
    ["Location", internship.location],
    ["Duration", internship.duration],
    ["Commitment", internship.hours]
  ];

  information.forEach(([label, value]) => {
    facts.append(
      makeElement("dt", "", label),
      makeElement("dd", "", value)
    );
  });

  const skillsContainer = document.getElementById("detailsSkills");
  skillsContainer.replaceChildren();

  internship.skills.forEach(skill => {
    skillsContainer.appendChild(makeElement("span", "tag", skill));
  });

  dialog.showModal();
}

function createCard(internship) {
  const card = document.createElement("article");
  card.className = "card";

  const button = makeElement("button", "", "View details");
  button.type = "button";
  button.setAttribute("aria-label", `View details for ${internship.role}`);
  button.addEventListener("click", () => showDetails(internship));

  card.append(
    makeElement(
      "span",
      "badge",
      internship.mode === "remote" ? "Remote" : "Local"
    ),
    makeElement("h3", "", internship.role),
    makeElement("p", "company", internship.company),
    makeElement("p", "", `Stipend: ${stipendText(internship.stipend)}`),
    makeElement("p", "", `Location: ${internship.location}`),
    makeElement("p", "", `Duration: ${internship.duration}`),
    createTags(internship.skills),
    button
  );

  return card;
}

function renderInternships() {
  const filtered = internships.filter(internship => {
    const paymentMatches =
      payFilter.value === "all" ||
      (payFilter.value === "paid" && internship.stipend > 0) ||
      (payFilter.value === "unpaid" && internship.stipend === 0);

    const modeMatches =
      modeFilter.value === "all" ||
      internship.mode === modeFilter.value;

    const skillMatches =
      skillFilter.value === "all" ||
      internship.skills.includes(skillFilter.value);

    return paymentMatches && modeMatches && skillMatches;
  });

  internshipList.replaceChildren(...filtered.map(createCard));

  resultCount.textContent =
    `${filtered.length} internship${filtered.length === 1 ? "" : "s"} found`;

  emptyMessage.hidden = filtered.length !== 0;
}

[payFilter, modeFilter, skillFilter].forEach(filter => {
  filter.addEventListener("change", renderInternships);
});

document.getElementById("resetButton").addEventListener("click", () => {
  payFilter.value = "all";
  modeFilter.value = "all";
  skillFilter.value = "all";
  renderInternships();
});

document.getElementById("closeDialog").addEventListener("click", () => {
  dialog.close();
});

renderInternships();

async function fetchInternshipsFromDatabase() {
  try {
    const response = await fetch("/api/internships");

    if (!response.ok) {
      throw new Error("Failed to fetch internships");
    }

    const internships = await response.json();

    console.log("Internships from database:", internships);

    return internships;

  } catch (error) {
    console.error("Database connection error:", error);
    return [];
  }
}

fetchInternshipsFromDatabase();
