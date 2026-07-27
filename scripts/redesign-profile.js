const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(app)/u/[handle]/profile-actions.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const replacement = `
function AnimatedInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative',
      borderRadius: 12,
      background: 'color-mix(in srgb, var(--soft) 50%, transparent)',
      boxShadow: focused ? '0 0 0 2px var(--primary)' : '0 0 0 1px var(--border)',
      transition: 'box-shadow 0.25s cubic-bezier(0.2, 0.85, 0.25, 1), background 0.25s ease',
    }}>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
      />
    </div>
  );
}

function AnimatedTextarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative',
      borderRadius: 12,
      background: 'color-mix(in srgb, var(--soft) 50%, transparent)',
      boxShadow: focused ? '0 0 0 2px var(--primary)' : '0 0 0 1px var(--border)',
      transition: 'box-shadow 0.25s cubic-bezier(0.2, 0.85, 0.25, 1), background 0.25s ease',
    }}>
      <textarea
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', fontSize: 15, color: 'var(--ink)', outline: 'none', resize: 'vertical' }}
      />
    </div>
  );
}

function EditProfileSheet({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProfileDraft;
  onClose: () => void;
  onSaved: (handle: string) => void;
}) {
  const { error } = useToast();
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const bioLeft = BIO_MAX - draft.bio.length;

  function toggleTag(tag: string) {
    setDraft((d) => ({ ...d, tags: d.tags.includes(tag) ? d.tags.filter((x) => x !== tag) : [...d.tags, tag] }));
  }

  async function writeForMe() {
    setSuggesting(true);
    const result = await suggestBio();
    setSuggesting(false);
    if (!result.ok) return error(result.error);
    set('bio', result.data.bio);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'profiles');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      set('coverUrl', json.url);
    } catch (err: any) {
      error(err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function save() {
    if (!draft.name.trim()) return error('Add your name first.');
    if (!draft.handle.trim()) return error('Pick a handle.');
    setSaving(true);
    const result = await saveProfile(draft);
    setSaving(false);
    if (!result.ok) return error(result.error);
    onSaved(result.data.handle);
  }

  return (
    <div
      onClick={onClose}
      className="sl-modal sl-scroll"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'color-mix(in srgb, var(--page) 40%, transparent)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'color-mix(in srgb, var(--card) 85%, transparent)',
          backdropFilter: 'blur(40px) saturate(1.5)',
          borderRadius: 26,
          border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)',
          boxShadow: '0 40px 100px rgba(0,0,0,.3)',
          animation: 'sl-modal-genie .62s cubic-bezier(.2,.85,.25,1) both',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
          <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 22, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 36, height: 36, borderRadius: 9999, border: 'none', background: 'color-mix(in srgb, var(--soft) 60%, transparent)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--soft) 60%, transparent)'}
          >
            <CrossIcon size={17} />
          </button>
        </div>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Cover & Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ ...fieldLabel, fontSize: 16, color: 'var(--ink)', marginBottom: 0 }}>Appearance</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>
              <div>
                <label style={fieldLabel}>Cover Image</label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 90,
                    borderRadius: 16,
                    border: draft.coverUrl ? 'none' : '2px dashed color-mix(in srgb, var(--ink) 15%, transparent)',
                    background: draft.coverUrl ? 'var(--card)' : 'color-mix(in srgb, var(--soft) 40%, transparent)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: uploadingCover ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {draft.coverUrl ? (
                    <>
                      <img src={draft.coverUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {!uploadingCover && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <span style={{ color: '#fff', font: '600 13px/1 var(--font-inter)' }}>Change cover</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--mute)', font: '600 13px/1 var(--font-inter)' }}>
                      {uploadingCover ? 'Uploading...' : 'Upload cover'}
                    </span>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleCoverUpload} disabled={uploadingCover} style={{ display: 'none' }} />
                </label>
                {draft.coverUrl && !uploadingCover ? (
                  <button onClick={() => set('coverUrl', null)} style={{ background: 'none', border: 'none', color: 'var(--negative)', font: '600 12px/1 var(--font-inter)', cursor: 'pointer', marginTop: 8 }}>Remove cover</button>
                ) : null}
              </div>
              
              <div>
                <span style={fieldLabel}>Avatar Color</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map((hex) => {
                    const on = draft.avatarColor.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={hex}
                        onClick={() => set('avatarColor', hex)}
                        aria-pressed={on}
                        aria-label={COLOR_NAMES[hex] ?? hex}
                        title={COLOR_NAMES[hex] ?? hex}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 9999,
                          background: hex,
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transform: on ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.2s cubic-bezier(0.2, 0.85, 0.25, 1)',
                        }}
                      >
                        {on && (
                          <div style={{ position: 'absolute', inset: -4, borderRadius: 9999, border: '2px solid var(--ink)', animation: 'sl-pop 0.3s cubic-bezier(0.2, 0.85, 0.25, 1)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }} />

          {/* Section: Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ ...fieldLabel, fontSize: 16, color: 'var(--ink)', marginBottom: 0 }}>Identity</span>
            <div className="sl-grid2w">
              <div>
                <label htmlFor="pe-name" style={fieldLabel}>Name</label>
                <AnimatedInput id="pe-name" value={draft.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label htmlFor="pe-handle" style={fieldLabel}>Handle</label>
                <div style={{ 
                  display: 'flex', alignItems: 'center', borderRadius: 12, 
                  background: 'color-mix(in srgb, var(--soft) 50%, transparent)',
                  boxShadow: '0 0 0 1px var(--border)',
                  padding: '0 14px' 
                }}>
                  <span style={{ color: 'var(--mute)', fontSize: 15 }}>@</span>
                  <input
                    id="pe-handle"
                    value={draft.handle}
                    onChange={(e) => set('handle', e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '12px 6px', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }} />

          {/* Section: Career & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ ...fieldLabel, fontSize: 16, color: 'var(--ink)', marginBottom: 0 }}>Career & Goals</span>
            <div className="sl-grid2w">
              <div>
                <label htmlFor="pe-uni" style={fieldLabel}>University</label>
                <AnimatedInput id="pe-uni" value={draft.university} onChange={(e) => set('university', e.target.value)} />
              </div>
              <div>
                <label htmlFor="pe-focus" style={fieldLabel}>Focus</label>
                <AnimatedInput id="pe-focus" value={draft.focus} onChange={(e) => set('focus', e.target.value)} placeholder="CSE student · product" />
              </div>
            </div>

            <div>
              <label htmlFor="pe-building" style={fieldLabel}>Building</label>
              <AnimatedInput id="pe-building" value={draft.building} onChange={(e) => set('building', e.target.value)} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label htmlFor="pe-bio" style={{ ...fieldLabel, marginBottom: 0 }}>Bio</label>
                <button
                  onClick={writeForMe}
                  disabled={suggesting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                    borderRadius: 9999,
                    padding: '7px 12px',
                    font: '600 12px/1 var(--font-inter), Inter, sans-serif',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 0 12px color-mix(in srgb, var(--primary) 30%, transparent)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 30%, transparent)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 20%, transparent)'}
                >
                  <SparkIcon size={13} color="var(--primary-active)" />
                  {suggesting ? 'Writing…' : 'Write it for me'}
                </button>
              </div>
              <AnimatedTextarea
                id="pe-bio"
                value={draft.bio}
                onChange={(e) => set('bio', e.target.value.slice(0, BIO_MAX))}
                rows={4}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: bioLeft < 20 ? 'var(--warning)' : 'var(--mute)', textAlign: 'right' }}>
                {bioLeft} characters left
              </div>
            </div>

            <div>
              <label htmlFor="pe-seeking" style={fieldLabel}>Looking for</label>
              <AnimatedInput id="pe-seeking" value={draft.seeking} onChange={(e) => set('seeking', e.target.value)} placeholder="A business co-founder in Dhaka" />
            </div>

            <div>
              <span style={fieldLabel}>Interests</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TAG_POOL.map((tag) => {
                  const on = draft.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      aria-pressed={on}
                      style={{
                        padding: '9px 15px',
                        borderRadius: 9999,
                        font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                        cursor: 'pointer',
                        background: on ? 'var(--primary)' : 'color-mix(in srgb, var(--card) 40%, transparent)',
                        color: on ? '#163300' : 'var(--ink)',
                        border: on ? '1px solid var(--primary)' : '1px solid color-mix(in srgb, var(--border-strong) 40%, transparent)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '20px 28px', borderTop: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', background: 'color-mix(in srgb, var(--soft) 30%, transparent)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 9999,
              padding: '12px 24px',
              font: '600 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              font: '600 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

const index = content.indexOf('function EditProfileSheet');
if (index === -1) {
  console.error('Could not find function EditProfileSheet');
  process.exit(1);
}

const newContent = content.slice(0, index) + replacement;
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('Successfully redesigned EditProfileSheet');
