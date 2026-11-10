// The public demo gym. It's rebuilt from this file every night, so visitors can change anything.
module.exports = {
  password: "password",
  gym: {
    name: "Legion Demo Gym",
    slug: "legion-demo",
    inviteCode: "LEGION-DEMO",
    publicCatalog: true,
  },
  // The owner's password is random on every reset. Visitors try admin features by opening their own gym.
  owner: { email: "owner@example.com", name: "Morgan Owner" },
  coach: { email: "coach@example.com", name: "Casey Coach" },
  athlete: { email: "athlete@example.com", name: "Alex Athlete" },

  members: [
    { key: "alex", name: "Alex Athlete", email: "athlete@example.com", gender: "non-binary", dateOfBirth: "1995-02-14" },
    { key: "jason", name: "Jason Miller", email: "jason@example.com", gender: "male", dateOfBirth: "1990-04-23" },
    { key: "tiffany", name: "Tiffany Brookston", email: "tiffany@example.com", gender: "female", dateOfBirth: "1996-06-09" },
    { key: "catrin", name: "Catrin Stevenson", email: "catrin@example.com", gender: "female", dateOfBirth: "2001-08-17" },
    { key: "greg", name: "Greg Bronson", email: "greg@example.com", gender: "male", dateOfBirth: "1993-04-08" },
  ],

  workouts: [
    {
      key: "tommyV",
      name: "Tommy V",
      mode: "For Time",
      equipment: ["barbell", "rope"],
      exercises: ["21 thrusters", "12 rope climbs, 15 ft", "15 thrusters", "9 rope climbs, 15 ft", "9 thrusters", "6 rope climbs, 15 ft"],
      trainerTips: ["Split the 21 thrusters as needed", "Try to do the 9 and 6 thrusters unbroken", "RX Weights: 115lb/75lb"],
    },
    {
      key: "deadPushUps",
      name: "Dead Push-Ups",
      mode: "AMRAP 10",
      equipment: ["barbell"],
      exercises: ["15 deadlifts", "15 hand-release push-ups"],
      trainerTips: ["Deadlifts are meant to be light and fast", "Try to aim for unbroken sets", "RX Weights: 135lb/95lb"],
    },
    {
      key: "heavyDT",
      name: "Heavy DT",
      mode: "5 Rounds For Time",
      equipment: ["barbell", "rope"],
      exercises: ["12 deadlifts", "9 hang power cleans", "6 push jerks"],
      trainerTips: ["Aim for unbroken push jerks", "The first three rounds might feel terrible, but stick to it", "RX Weights: 205lb/145lb"],
    },
    {
      key: "coreBuster",
      name: "Core Buster",
      mode: "AMRAP 20",
      equipment: ["rack", "barbell", "abmat"],
      exercises: ["15 toes to bars", "10 thrusters", "30 abmat sit-ups"],
      trainerTips: ["Split your toes to bars in two sets maximum", "Go unbroken on the thrusters", "Take the abmat sit-ups as a chance to normalize your breath"],
    },
    {
      key: "jumping",
      name: "Jumping (Not) Made Easy",
      mode: "AMRAP 12",
      equipment: ["jump rope"],
      exercises: ["10 burpees", "25 double-unders"],
      trainerTips: ["Scale to do 50 single-unders, if double-unders are too difficult"],
    },
    {
      key: "burpeeMeters",
      name: "Burpee Meters",
      mode: "3 Rounds For Time",
      equipment: ["row erg"],
      exercises: ["Row 500 meters", "21 burpees", "Run 400 meters", "Rest 3 minutes"],
      trainerTips: ["Go hard", "Note your time after the first run", "Try to hold your pace"],
    },
    {
      key: "dumbbellRower",
      name: "Dumbbell Rower",
      mode: "AMRAP 15",
      equipment: ["dumbbell"],
      exercises: ["15 dumbbell rows, left arm", "15 dumbbell rows, right arm", "50-ft handstand walk"],
      trainerTips: ["RX weights for women: 35-lb", "RX weights for men: 50-lb"],
    },
  ],

  records: [
    { member: "catrin", workout: "deadPushUps", result: "160 reps" },
    { member: "catrin", workout: "heavyDT", result: "7:23" },
    { member: "catrin", workout: "coreBuster", result: "358 reps" },
    { member: "jason", workout: "coreBuster", result: "301 reps" },
    { member: "greg", workout: "deadPushUps", result: "171 reps" },
    { member: "alex", workout: "tommyV", result: "9:41" },
    { member: "alex", workout: "burpeeMeters", result: "14:05" },
  ],
};
