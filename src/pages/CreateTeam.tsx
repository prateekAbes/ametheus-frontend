import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Container, Hud, Crest, Cta, Panel, Field, Brackets } from '../components/ui'
import { GAMES, gameBy } from '../lib/data'
import { createTeam } from '../services/teams'
import { useAuthContext } from '../context/AuthContext'

const STEPS = ['Team Info', 'Game Handle', 'Confirm'] as const

export default function CreateTeam() {
  const navigate = useNavigate()
  const { isSignedIn, profile } = useAuthContext()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [game, setGame] = useState(GAMES[0]?.slug || 'valorant')
  const [gameHandle, setGameHandle] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const g = gameBy(game)
  const display = name.trim() || 'Your Team'
  const displayTag = (tag.trim() || display.replace(/[^A-Za-z0-9]/g, '').slice(0, 4)).toUpperCase()

  const handleCreate = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const handle = gameHandle.trim() || profile?.username || 'Contender'
      const res = await createTeam({
        name: name.trim(),
        tag: displayTag,
        game_slug: game,
        game_id: game,
        captain_handle: handle,
        game_handle: handle,
      })
      if (res && res.invite_code) {
        setCreatedCode(res.invite_code)
        setStep(2)
      } else {
        navigate('/teams')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create team. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canNext =
    step === 0
      ? name.trim().length >= 2 && displayTag.length >= 2
      : step === 1
      ? true
      : true

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        <Hud className="text-cyan">◇ Team forge</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85]">
          Create team
        </h1>

        <div className="mt-10 grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <button key={s} disabled={i > step} onClick={() => setStep(i)} className="text-left">
              <div
                className={`h-[3px] transition-colors duration-500 ${
                  i <= step ? 'bg-cyan' : 'bg-white/10'
                }`}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className={`font-mono text-xs ${i <= step ? 'text-cyan' : 'text-dim'}`}>
                  0{i + 1}
                </span>
                <span
                  className={`font-display text-sm font-black uppercase tracking-[0.08em] md:text-lg ${
                    i === step ? 'text-ink' : 'text-dim'
                  }`}
                >
                  {s}
                </span>
              </div>
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-6 border border-live/40 bg-live/10 p-4 font-mono text-xs text-live">
            {errorMessage}
          </div>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div key={step} className="page-in">
            {step === 0 && (
              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field
                    label="Team name"
                    placeholder="e.g. Soul Seekers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={32}
                  />
                  <Field
                    label="Team Tag (2-5 characters)"
                    placeholder="e.g. SOUL"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                    maxLength={5}
                  />
                </div>

                <div>
                  <Hud>Game</Hud>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {GAMES.map((x) => (
                      <button
                        key={x.slug}
                        type="button"
                        onClick={() => setGame(x.slug)}
                        className={`relative border p-4 text-left transition-all ${
                          game === x.slug
                            ? 'bg-white/[0.04]'
                            : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                        style={game === x.slug ? { borderColor: x.accent } : undefined}
                      >
                        {game === x.slug && <Brackets color="border-white/60" />}
                        <p
                          className="font-display text-xl font-black tracking-[0.08em]"
                          style={{ color: x.accent }}
                        >
                          {x.short}
                        </p>
                        <Hud className="mt-1 block">{x.squad}</Hud>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <Hud>Captain In-Game Credentials</Hud>
                <p className="text-sm text-dim">
                  Enter your in-game nickname or character UID so tournament organizers can verify your lobby entry.
                </p>
                <Field
                  label={`Your ${g.short} Handle / UID`}
                  placeholder="e.g. 5123884102 or Vyrus#IND"
                  value={gameHandle}
                  onChange={(e) => setGameHandle(e.target.value)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Panel className="p-6 md:p-8">
                  <Brackets color="border-cyan/50" />
                  <Hud className="text-ok">✓ Squad Successfully Registered</Hud>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-dim">
                    Your Official Team Invite Code
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <p className="font-mono text-4xl tracking-[0.25em] text-cyan md:text-5xl">
                      {createdCode}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(createdCode)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      }}
                      className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-cyan"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-dim">
                    Share this code with your roster members. They can enter it under <b>Teams → Join Team</b> to join your squad immediately.
                  </p>
                </Panel>
                <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
                  {[
                    ['Team', display],
                    ['Tag', displayTag],
                    ['Game', g.name],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-void p-5">
                      <Hud>{k}</Hud>
                      <p className="mt-1 font-display text-2xl font-black uppercase">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {step > 0 && step < 2 && (
                <Cta ghost small arrow={false} onClick={() => setStep(step - 1)}>
                  ← Back
                </Cta>
              )}
              {step === 0 && (
                <Cta small disabled={!canNext} onClick={() => setStep(1)}>
                  Continue →
                </Cta>
              )}
              {step === 1 && (
                <Cta small disabled={isSubmitting} onClick={handleCreate}>
                  {isSubmitting ? 'Forging Team...' : 'Create Team Now'}
                </Cta>
              )}
              {step === 2 && (
                <Cta small to="/teams">
                  Go to Squad Hub
                </Cta>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Hud>Team crest preview</Hud>
            <div className="relative mt-3 overflow-hidden border border-white/10 bg-surface p-6">
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 80% 0%, ${g.accent}33, transparent 60%)`,
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span
                    className="font-display text-sm font-black tracking-[0.15em]"
                    style={{ color: g.accent }}
                  >
                    {g.short}
                  </span>
                  <Hud>[{displayTag}]</Hud>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <Crest name={display} size={64} color={g.accent} />
                  <div>
                    <p className="font-display text-3xl font-black uppercase leading-[0.9]">
                      {display}
                    </p>
                    <span className="font-mono text-xs text-dim">[{displayTag}]</span>
                  </div>
                </div>
                <div className="mt-8 border-t border-white/10 pt-4">
                  <Hud>Captain: {profile?.username || 'You'}</Hud>
                  {gameHandle && (
                    <p className="mt-1 font-mono text-xs text-cyan">In-game: {gameHandle}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  )
}
