import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_EFFECTIVE_DATE, LEGAL_OPERATOR, type PolicyDoc } from './legal-common';

// Khung hiển thị dùng chung cho mọi trang pháp lý (privacy policy, terms).
// Cố ý KHÔNG dùng AppLayout: trang phải mở được khi chưa đăng nhập và không gọi API nào,
// để người duyệt app của Google/Apple luôn xem được kể cả khi backend lỗi.
// Có VI/EN vì reviewer thường đọc bản tiếng Anh.
type Lang = 'vi' | 'en';

const head: React.CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 700 };

interface LegalDocumentViewProps {
  vi: PolicyDoc;
  en: PolicyDoc;
  /** Link tới trang pháp lý còn lại, hiện ở cuối trang. */
  otherPage: { to: string; labelVi: string; labelEn: string };
}

export function LegalDocumentView({ vi, en, otherPage }: LegalDocumentViewProps) {
  const [lang, setLang] = useState<Lang>('vi');
  const doc = lang === 'vi' ? vi : en;

  useEffect(() => {
    document.title = `${doc.title} — FandomVote`;
    document.documentElement.lang = lang;
  }, [doc.title, lang]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-cream, #FAF7F0)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px 64px' }}>
        <div className="spread" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <Link to="/" style={{ ...head, fontSize: 20, textDecoration: 'none', color: 'var(--c-ink)' }}>
            ← FandomVote
          </Link>
          <div className="row" style={{ gap: 8 }}>
            {(['vi', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  border: '2px solid var(--c-ink)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: 'var(--font-head)',
                  cursor: 'pointer',
                  background: lang === l ? 'var(--c-ink)' : 'var(--c-white)',
                  color: lang === l ? '#fff' : 'var(--c-ink)',
                }}
              >
                {l === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <article
          style={{
            background: 'var(--c-white)',
            border: '3px solid var(--c-ink)',
            borderRadius: 14,
            boxShadow: '5px 5px 0 var(--c-ink)',
            padding: '28px 26px',
          }}
        >
          <h1 style={{ ...head, fontSize: 28, margin: '0 0 6px' }}>{doc.title}</h1>
          <div className="mono" style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
            {LEGAL_OPERATOR} · {doc.effectiveLabel}: {LEGAL_EFFECTIVE_DATE[lang]}
          </div>

          {doc.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>
              {p}
            </p>
          ))}

          {doc.sections.map((s) => (
            <section key={s.heading} style={{ marginTop: 26 }}>
              <h2 style={{ ...head, fontSize: 17, margin: '0 0 10px' }}>{s.heading}</h2>
              {s.paragraphs?.map((p, i) => (
                <p key={i} style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 10px' }}>
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul style={{ margin: '0 0 10px', paddingLeft: 22 }}>
                  {s.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 6 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div style={{ marginTop: 28, paddingTop: 16, borderTop: '2px solid #efe9dc' }}>
            <Link to={otherPage.to} style={{ fontSize: 13 }}>
              {lang === 'vi' ? otherPage.labelVi : otherPage.labelEn} →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
