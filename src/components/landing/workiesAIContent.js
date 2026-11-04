// Static markup for the Workies AI landing page (own content). Form is rendered in React.
export const LOGO_URL = "https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/35dda667c_wai-logo.webp";
export const HERO_URL = "__HERO_URL__";
export const STAGE_URL = "__STAGE_URL__";
const fill = (html) => html.replaceAll("__LOGO__", LOGO_URL).replaceAll("__HERO__", HERO_URL).replaceAll("__STAGE__", STAGE_URL);
export const TOP_HTML = fill(`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="spark" viewBox="0 0 24 24"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></g></symbol></svg>

<header class="hero band on-dark" id="top">
  <div class="wrap">
    <div class="hero-top">
      <img src="__LOGO__" alt="Workies">
      <a href="#register-form">הרשמה למפגשים</a>
    </div>
    <div class="hero-grid">
      <div>
        <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>Workies AI</div>
        <h1>מפגשי <em>בינה מלאכותית</em> לעסקים</h1>
        <p class="lead">באים כמו שאתם. לומדים, מתנסים ומתקדמים עם העסק.</p>
        <div class="roles" aria-label="מה תלמדו לעשות עם AI">
          <span>עמודי נחיתה ואתרים</span><span>סרטוני שיווק</span><span>מצגות ותוכן לסושיאל</span><span>אוטומציות וסוכנים</span><span>ניהול משימות</span><span>נראות במנועי AI</span>
        </div>
        <p class="sub">סדרת מפגשים מעשיים לבעלי עסקים שרוצים להכיר את כלי הבינה המלאכותית, ללמוד כיצד להשתמש בהם ולשלב אותם בעבודה היומיומית.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#register-form">הרשמה למפגשים</a>
          <a class="btn btn-line" href="#overview">ששת המפגשים</a>
        </div>
        <p class="hero-note">כל המפגשים במימון מלא של Workies ובהרשמה מראש.</p>
      </div>
      <div class="hero-visual">
        <figure class="hero-photo"><img src="__HERO__" alt="כיתת הלימוד של Workies, ועל מסך ההקרנה ממשק של עוזר בינה מלאכותית" fetchpriority="high"></figure>
        <div class="chat" aria-label="דוגמה לבקשה לעוזר AI">
          <div class="lbl">דוגמה לבקשה · מפגש 01</div>
          <div class="row"><svg class="spark"><use href="#spark"/></svg><span>בנה לי עמוד נחיתה לשירות שלי, עם טופס להשארת פרטים<i class="caret"></i></span></div>
        </div>
      </div>
    </div>
  </div>
</header>

<div class="facts band">
  <div class="wrap">
    <ul>
      <li><strong>אחת לשבועיים</strong><span>מפגש פרונטלי</span></li>
      <li><strong>60 דקות</strong><span>משך כל מפגש</span></li>
      <li><strong>6 נושאים</strong><span>מעשיים, לבחירה</span></li>
      <li><strong>ללא עלות</strong><span>במימון מלא של Workies</span></li>
    </ul>
  </div>
</div>

<section class="fit band">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>למי זה מתאים</div>
      <h2>לא צריך ידע מוקדם. לא צריך רקע טכנולוגי.</h2>
      <p>רק להגיע עם העסק שלכם והרצון להתקדם.</p>
    </div>
    <div class="fit-grid">
      <div class="fit-box">
        <h3>מתאים לכם אם</h3>
        <ul class="ticks">
          <li>אתם בעלי עסק ורוצים להכיר את כלי הבינה המלאכותית.</li>
          <li>זו הפעם הראשונה שלכם עם בינה מלאכותית, או שכבר התחלתם להתנסות.</li>
          <li>אתם רוצים לשלב את הכלים בעבודה היומיומית.</li>
          <li>אתם רוצים לצאת עם תוצר ראשוני שאפשר לפתח וליישם בעסק.</li>
        </ul>
      </div>
      <div class="fit-box dark">
        <h3>איך זה עובד</h3>
        <ul class="ticks">
          <li>מפגש פרונטלי אחת לשבועיים, 60 דקות.</li>
          <li>כל מפגש עצמאי. אפשר להצטרף בכל שלב.</li>
          <li>הסברים פשוטים, הדגמות והתנסות מעשית.</li>
          <li>אפשרות להמשך הכשרה בקבוצות קטנות ולליווי אישי בתשלום.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="overview band" id="overview">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>ששת המפגשים</div>
      <h2>שישה מפגשים. מכל אחד יוצאים עם תוצר.</h2>
      <p>בחרו את המפגש שלכם. כל מפגש הוא הזדמנות ללמוד יכולת חדשה ולהתחיל להשתמש בה בעסק.</p>
    </div>
    <div class="tiles">
      <a class="tile" href="#s1"><span class="n">01</span><h3>עמודי נחיתה, אתרים ואפליקציות</h3><p>אבטיפוס ראשוני של עמוד נחיתה, אתר או אפליקציה.</p><span class="go">לפרטי המפגש</span></a>
      <a class="tile" href="#s2"><span class="n">02</span><h3>סרטוני שיווק</h3><p>תסריט מוכן וחומרי וידאו ראשוניים לסרטון שיווקי.</p><span class="go">לפרטי המפגש</span></a>
      <a class="tile" href="#s3"><span class="n">03</span><h3>מצגות, עיצובים ותוכן לסושיאל</h3><p>מצגת קצרה או חומר שיווקי ראשוני לעסק.</p><span class="go">לפרטי המפגש</span></a>
      <a class="tile" href="#s4"><span class="n">04</span><h3>אוטומציות וסוכנים חכמים</h3><p>אפיון תהליך אוטומטי או עוזר AI ראשוני לעסק.</p><span class="go">לפרטי המפגש</span></a>
      <a class="tile" href="#s5"><span class="n">05</span><h3>ניהול זמן, משימות ותיעדוף</h3><p>תוכנית משימות אישית או תהליך עבודה לניהול משימות וסיכומי פגישות.</p><span class="go">לפרטי המפגש</span></a>
      <a class="tile" href="#s6"><span class="n">06</span><h3>GEO: נראות במנועי AI</h3><p>מפת מצב ראשונית ורשימת פעולות לשיפור הנוכחות של העסק במנועי AI.</p><span class="go">לפרטי המפגש</span></a>
    </div>
  </div>
</section>

<section class="sessions band" id="sessions">
  <div class="wrap">
    <div class="series">

      <article class="sess" id="s1">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>בנה לי עמוד נחיתה לשירות שלי, עם טופס להשארת פרטים.</span></div><div class="badges"><span>60 דקות</span><span>Claude · Base44</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">01</div>
            <h3>עמודי נחיתה, אתרים ואפליקציות עם Base44 ו-Claude</h3>
            <p class="tag">בונים בעצמכם כלים דיגיטליים לעסק.</p>
            <p class="about">נלמד כיצד להפוך רעיון או צורך עסקי לעמוד נחיתה, אתר או אפליקציה, גם ללא ידע בתכנות.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נגדיר צורך עסקי ונאפיין פתרון.</li>
              <li>נכיר את סביבת Base44.</li>
              <li>נשתמש ב-Claude לפיתוח האפיון והתוכן.</li>
              <li>נבנה גרסה ראשונית של פתרון דיגיטלי.</li>
            </ul></div>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>אבטיפוס ראשוני של עמוד נחיתה, אתר או אפליקציה.</div></div>
          </div>
        </div>
      </article>

      <article class="sess" id="s2">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>כתוב לי תסריט של 30 שניות לסרטון שמציג את השירות שלנו.</span></div><div class="badges"><span>60 דקות</span><span>Claude · כלי וידאו</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">02</div>
            <h3>סרטוני שיווק עם Claude</h3>
            <p class="tag">מרעיון לסרטון שמציג את העסק שלכם.</p>
            <p class="about">נכיר את תהליך יצירת סרטוני השיווק בעזרת Claude וכלי וידאו משלימים, משלב הרעיון ועד להכנת סרטון לפרסום.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נפתח רעיון לסרטון שיווקי.</li>
              <li>נכתוב תסריט קצר וממוקד.</li>
              <li>נלמד כיצד לייצר חומרים ויזואליים ולהניע אותם.</li>
              <li>נתנסה בשילוב טקסט, קריינות ועריכה באמצעות כלי AI.</li>
            </ul></div>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>תסריט מוכן וחומרי וידאו ראשוניים לסרטון שיווקי.</div></div>
          </div>
        </div>
      </article>

      <article class="sess" id="s3">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>הכן לי מצגת של 5 שקפים שמציגה את העסק שלי ללקוח חדש.</span></div><div class="badges"><span>60 דקות</span><span>Claude</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">03</div>
            <h3>מצגות, עיצובים ותוכן לסושיאל עם Claude</h3>
            <p class="tag">הופכים רעיון עסקי לתוכן מקצועי ומעוצב.</p>
            <p class="about">נלמד כיצד להשתמש ב-Claude כדי לפתח מצגות, לעצב חומרים שיווקיים וליצור תוכן לרשתות החברתיות.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נלמד כיצד להגדיר משימה שיווקית ולקבל תוצאה מדויקת.</li>
              <li>נפתח מצגת עסקית באמצעות Claude.</li>
              <li>ניצור עיצובים וחומרים שיווקיים.</li>
              <li>נתאים תוכן לפוסטים ולרשתות החברתיות.</li>
            </ul></div>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>מצגת קצרה או חומר שיווקי ראשוני לעסק.</div></div>
          </div>
        </div>
      </article>

      <article class="sess" id="s4">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>בכל יום ראשון אסוף את הפניות החדשות ושלח לי סיכום.</span></div><div class="badges"><span>60 דקות</span><span>אוטומציה · סוכן AI</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">04</div>
            <h3>אוטומציות וסוכנים חכמים לעסק</h3>
            <p class="tag">נותנים לבינה המלאכותית לעבוד בשבילכם.</p>
            <p class="about">נכיר דרכים להפוך משימות חוזרות לתהליכים אוטומטיים ולהתאים סוכני AI לפעילות העסקית.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נזהה משימות חוזרות בעסק.</li>
              <li>נבין את ההבדל בין אוטומציה לסוכן חכם.</li>
              <li>נכיר תהליכי עבודה אוטומטיים.</li>
              <li>נתנסה בהגדרת עוזר AI למשימה עסקית.</li>
            </ul></div>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>אפיון תהליך אוטומטי או עוזר AI ראשוני לעסק.</div></div>
          </div>
        </div>
      </article>

      <article class="sess" id="s5">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>הפוך את תמליל הפגישה הזו לסיכום, החלטות ורשימת משימות.</span></div><div class="badges"><span>60 דקות</span><span>כלי AI לניהול</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">05</div>
            <h3>ניהול זמן, משימות ותיעדוף בעזרת AI</h3>
            <p class="tag">פחות עומס ניהולי. יותר זמן לעסק.</p>
            <p class="about">נלמד כיצד להשתמש בכלי AI כדי לנהל את סדר היום, לארגן משימות, לתעד פגישות ולהפוך מידע לפעולות.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נבנה סדרי עדיפויות ותוכנית עבודה.</li>
              <li>נלמד כיצד להפוך תמלילי פגישות לסיכומים.</li>
              <li>נפיק משימות והחלטות מתוך שיחות ומסמכים.</li>
              <li>נכיר כלים לתכנון וניהול העבודה השוטפת.</li>
            </ul></div>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>תוכנית משימות אישית או תהליך עבודה לניהול משימות וסיכומי פגישות.</div></div>
          </div>
        </div>
      </article>

      <article class="sess" id="s6">
        <div class="prompt"><div class="row"><svg class="spark"><use href="#spark"/></svg><span><span class="lbl">דוגמה לבקשה · </span>איזה עסקים אתה ממליץ עליהם כשמבקשים שירות כמו שלי?</span></div><div class="badges"><span>60 דקות</span><span>GEO</span></div></div>
        <div class="sess-body">
          <div class="sess-main">
            <div class="num">06</div>
            <h3>GEO: איך גורמים למנועי הבינה למצוא את העסק שלכם?</h3>
            <p class="tag">כשהלקוחות שואלים את הבינה המלאכותית, איך מגדילים את הסיכוי שיגיעו אליכם?</p>
            <p class="about">נכיר את עולם ה-GEO, התאמת הנוכחות הדיגיטלית למנועי תשובות מבוססי בינה מלאכותית.</p>
          </div>
          <div class="sess-side">
            <div><h4>מה נעשה במפגש?</h4><ul class="dots">
              <li>נבין כיצד מנועי AI מאתרים ומציגים מידע על עסקים.</li>
              <li>נבדוק כיצד העסק מופיע בתשובות של מנועי AI.</li>
              <li>נלמד כיצד לשפר את בהירות המידע על העסק באתר ובערוצים הדיגיטליים.</li>
              <li>נכין תוכנית ראשונית לשיפור הנראות.</li>
            </ul></div>
            <p class="caveat">חשוב לדעת: אין דרך להבטיח הופעה או המלצה בתשובות של מנועי AI.</p>
            <div class="out"><svg class="spark"><use href="#spark"/></svg><div><b>התוצר</b>מפת מצב ראשונית ורשימת פעולות לשיפור הנוכחות של העסק במנועי AI.</div></div>
          </div>
        </div>
      </article>

    </div>
  </div>
</section>

<section class="path band on-dark" id="lab">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>רוצים לקחת את זה צעד קדימה?</div>
      <h2>מהלמידה להטמעה בעסק</h2>
      <p>המפגשים הם נקודת ההתחלה. מכאן אפשר להמשיך לפי הצורך של העסק.</p>
    </div>
    <div class="ladder">
      <div class="rung on"><h3>מפגשי Workies AI</h3><p>שישה נושאים מעשיים. מפגש עצמאי של 60 דקות, אחת לשבועיים.</p><span class="pr">ללא עלות</span></div>
      <div class="rung"><h3>Workies AI Lab</h3><p>סדנת המשך בקבוצה של עד ארבעה בעלי עסקים, בהנחיה אישית.</p><span class="pr">500 ש"ח למשתתף למפגש</span></div>
      <div class="rung"><h3>ליווי אישי</h3><p>ליווי מותאם לצורכי העסק.</p><span class="pr">בתשלום נפרד</span></div>
      <div class="rung"><h3>Workies AI Open Stage</h3><p>ערב קהילתי חודשי להצגת התוצרים שפיתחתם.</p><span class="pr">אחת לחודש</span></div>
    </div>

    <div class="lab-grid">
      <div>
        <div class="eyebrow">Workies AI Lab</div>
        <h2>Workies AI Lab | מהלמידה להטמעה בעסק</h2>
        <p class="lead">למדתם כלי חדש ורוצים להפוך אותו לפתרון שעובד בעסק שלכם?</p>
        <p class="t">בדיוק בשביל זה יצרנו את סדנאות ההמשך. הכשרה מעשית בקבוצה של עד ארבעה בעלי עסקים, בהנחיה אישית ובמיקוד בצרכים של כל עסק.</p>
        <h4>במהלך הסדנה</h4>
        <ol class="flow">
          <li>נזהה ונפצח את הצורך העסקי שלכם.</li>
          <li>נתאים את כלי הבינה המלאכותית לפתרון.</li>
          <li>נפתח יחד תוצר מעשי.</li>
          <li>נגדיר את שלבי ההטמעה בעבודה השוטפת.</li>
        </ol>
      </div>
      <aside class="price">
        <div class="eyebrow">סדנת המשך</div>
        <div class="n">500 <small>ש"ח</small></div>
        <p>למשתתף למפגש.</p>
        <p>הסדנאות מתקיימות במועדים נפרדים, בהרשמה מראש ובמספר מקומות מוגבל.</p>
        <p>ניתן גם להמשיך לליווי אישי מותאם לצורכי העסק, בתשלום נפרד.</p>
        <a class="btn btn-primary" href="#register-form">פרטים על סדנאות ההמשך</a>
      </aside>
    </div>
  </div>
</section>

<section class="stage band" id="stage">
  <div class="wrap stage-grid">
    <figure class="stage-photo"><img src="__STAGE__" alt="אולם הקהילה של Workies, ועל מסך ההקרנה אפליקציה שנבנתה בעזרת בינה מלאכותית" loading="lazy"></figure>
    <div>
      <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>Workies AI Open Stage</div>
      <h2>הבמה של העסקים שיוצרים את העתיד</h2>
      <p class="lead">אחת לחודש נפגשים לערב קהילתי מיוחד שבו בעלי עסקים מציגים את התוצרים שפיתחו באמצעות הבינה המלאכותית.</p>
      <p class="t">זו ההזדמנות לעלות לבמה, להציג את מה שבניתם, לשתף כיצד עשיתם זאת ולתת השראה לבעלי עסקים נוספים. הערב פתוח לבעלי עסקים, חברי קהילה ואורחים מהעיר ומהסביבה.</p>
      <p class="motto">לומדים. יוצרים. משתפים. מתקדמים יחד.</p>
      <a class="btn btn-line" href="#register-form">הצטרפות לבמה הקהילתית</a>
    </div>
  </div>
</section>

<section class="faq band" id="faq">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow"><svg class="spark"><use href="#spark"/></svg>שאלות שחוזרות</div>
      <h2>לפני שנרשמים</h2>
    </div>
    <div class="faq-grid">
      <div>
        <div class="qa"><h3>כמה עולה ההשתתפות?</h3><p>ההשתתפות במפגש ללא עלות. כל ששת מפגשי ההכשרה במימון מלא של Workies.</p></div>
        <div class="qa"><h3>למה צריך להשאיר פרטי כרטיס אשראי?</h3><p>הכרטיס משמש כפיקדון להבטחת הגעה. הוא לא יחויב בגין השתתפות במפגש.</p></div>
        <div class="qa"><h3>מה קורה אם לא הגעתי?</h3><p>במקרה של אי הגעה למפגש שאליו נרשמתם, יחויב הכרטיס בסך 50 ש"ח, בהתאם לתנאי ההרשמה.</p></div>
        <div class="qa"><h3>צריך ידע מוקדם או רקע טכנולוגי?</h3><p>לא. רק להגיע עם העסק שלכם והרצון להתקדם.</p></div>
        <div class="qa"><h3>אפשר להצטרף באמצע הסדרה?</h3><p>כן. כל מפגש עצמאי, ואפשר להצטרף בכל שלב.</p></div>
        <div class="qa"><h3>מה אם ארצה להמשיך אחרי המפגש?</h3><p>אפשר להמשיך ל-Workies AI Lab, סדנת המשך של 500 ש"ח למשתתף למפגש, או לליווי אישי בתשלום נפרד.</p></div>
      </div>
      <aside class="terms">
        <h3>הרשמה ותנאי השתתפות</h3>
        <p class="t">כל ששת מפגשי ההכשרה פתוחים לבעלי עסקים במימון מלא של Workies. ההשתתפות מותנית בהרשמה מראש ובהשארת פרטי כרטיס אשראי כפיקדון להבטחת הגעה.</p>
        <ul>
          <li>ההשתתפות במפגש ללא עלות.</li>
          <li>הכרטיס לא יחויב בגין השתתפות במפגש.</li>
          <li>במקרה של אי הגעה למפגש שאליו נרשמתם, יחויב הכרטיס בסך 50 ש"ח, בהתאם לתנאי ההרשמה.</li>
          <li>מספר המקומות מוגבל.</li>
          <li>סדנאות ההמשך והליווי האישי כרוכים בתשלום ובהרשמה נפרדת.</li>
        </ul>
      </aside>
    </div>
  </div>
</section>`);
export const FOOT_HTML = fill(`<footer class="band">
  <div class="wrap">
    <img src="__LOGO__" alt="Workies">
    <span class="s">WORK • MEET • GROW</span>
  </div>
</footer>`);
