// Seeds the storefront's editorial content: the static pages linked from the
// footer, and a couple of sample news posts for the landing page. Idempotent
// and non-destructive: existing pages are never overwritten, and posts are only
// added when there are none yet.
//
// The page copy is a plain starting point — the terms in particular need the
// owner's / a lawyer's review before launch (see docs/ROADMAP.md, Phase 6).
//
//   npm run seed-content

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PAGES = [
  {
    slug: "about",
    title: "אודות",
    bodyHtml: `
<p>מלבי אקספרס הוא שירות משלוחים של אלכוהול ונשנושים באשקלון והסביבה.</p>
<p>במבחר בירות, יינות ומשקאות חריפים, לצד חטיפים, מתוקים, שתייה קלה ואביזרים. מזמינים באתר או בוואטסאפ, ואנחנו מגיעים עד הדלת.</p>
`,
  },
  {
    slug: "contact",
    title: "צור קשר",
    bodyHtml: `
<p>הדרך המהירה ביותר ליצור קשר היא בוואטסאפ.</p>
<p><a href="https://api.whatsapp.com/send?phone=972523311457" target="_blank" rel="noopener noreferrer">שלחו לנו הודעה בוואטסאפ</a></p>
<p>טלפון: <a href="tel:0523311457">052-331-1457</a></p>
`,
  },
  {
    slug: "terms",
    title: "תקנון",
    bodyHtml: `
<h2>גיל</h2>
<p>מכירת משקאות אלכוהוליים ומוצרי טבק מיועדת לגילאי 18 ומעלה בלבד. השליח רשאי לבקש תעודה מזהה בעת המסירה ולא למסור את ההזמנה אם הגיל אינו מאומת.</p>
<h2>הזמנות ומשלוחים</h2>
<p>המשלוחים מתבצעים באשקלון והסביבה. קיים מינימום הזמנה, המוצג בסל הקניות לפני התשלום.</p>
<h2>תשלום</h2>
<p>התשלום מתבצע בכרטיס אשראי באמצעות ספק סליקה מאובטח. פרטי האשראי אינם נשמרים באתר.</p>
<h2>שינויים וביטולים</h2>
<p>לשינוי או ביטול הזמנה יש לפנות אלינו בוואטסאפ בהקדם האפשרי, ובכל מקרה לפני יציאת השליח.</p>
`,
  },
];

const SAMPLE_POSTS = [
  {
    title: "האתר החדש באוויר",
    body: "אפשר להזמין עכשיו ישירות באתר: בוחרים מוצרים, מוסיפים לסל ומשלמים. אנחנו מגיעים עד הדלת באשקלון והסביבה. ההזמנה בוואטסאפ ממשיכה לעבוד כרגיל.",
    isPinned: true,
  },
  {
    title: "איך מזמינים?",
    body: "נכנסים לקטגוריה, בוחרים גודל וכמות ולוחצים על הוספה לסל. בסל רואים את הסכום ומה חסר להגעה למינימום הזמנה. את הפרטים למשלוח ממלאים פעם אחת בתשלום.",
    isPinned: false,
  },
];

async function main() {
  for (const page of PAGES) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log(`Static pages ensured: ${PAGES.map((p) => p.slug).join(", ")}`);

  if ((await prisma.post.count()) === 0) {
    const now = Date.now();
    for (const [index, post] of SAMPLE_POSTS.entries()) {
      await prisma.post.create({
        data: { ...post, isPublished: true, publishedAt: new Date(now - index * 60_000) },
      });
    }
    console.log(`Created ${SAMPLE_POSTS.length} sample news posts.`);
  } else {
    console.log("Posts already exist; leaving them alone.");
  }
}

main()
  .catch((err) => {
    console.error("Seeding content failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
