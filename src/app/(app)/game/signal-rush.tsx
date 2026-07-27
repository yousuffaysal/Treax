'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/toast-provider';
import { CheckIcon, CrossIcon } from '@/components/ui/icons';
import { GAME_BANK, shuffle, type GameItem } from '@/lib/game-bank';
import { submitGameScore } from './actions';

/** Signal Rush — 30 seconds to sort real updates from hype. */

const ROUND_SECONDS = 30;

type Answer = { index: number; choice: 'accept' | 'bounce' };

export function SignalRush({
  viewer,
  personalBest,
  leaderboard,
}: {
  viewer: { initials: string; avatarColor: string; avatarUrl?: string | null; name: string };
  personalBest: number;
  leaderboard: Array<{ id: string; score: number; user: { name: string; initials: string; avatarColor: string } }>;
}) {
  const router = useRouter();
  const { error } = useToast();

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [deck, setDeck] = useState<Array<GameItem & { index: number }>>([]);
  const [position, setPosition] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flash, setFlash] = useState<{ correct: boolean; why: string } | null>(null);
  const [result, setResult] = useState<{ score: number; solved: number; missed: number } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(
    async (finalAnswers: Answer[]) => {
      setRunning(false);
      setDone(true);
      const saved = await submitGameScore({ answers: finalAnswers });
      if (!saved.ok) return error(saved.error);
      setResult(saved.data);
      router.refresh();
    },
    [error, router],
  );

  // The clock. Ending the round submits whatever has been answered so far.
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      void finish(answers);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, timeLeft, answers, finish]);

  useEffect(() => () => void (flashTimer.current && clearTimeout(flashTimer.current)), []);

  function start() {
    // Two passes through a shuffled bank is more than 30 seconds allows.
    const indexed = GAME_BANK.map((item, index) => ({ ...item, index }));
    setDeck([...shuffle(indexed), ...shuffle(indexed)]);
    setPosition(0);
    setAnswers([]);
    setTimeLeft(ROUND_SECONDS);
    setResult(null);
    setFlash(null);
    setDone(false);
    setRunning(true);
  }

  function answer(choice: 'accept' | 'bounce') {
    const card = deck[position];
    if (!card || !running) return;

    const correct = card.verdict === choice;
    const next = [...answers, { index: card.index, choice }];
    setAnswers(next);
    setFlash({ correct, why: card.why });

    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1400);

    if (position + 1 >= deck.length) void finish(next);
    else setPosition((p) => p + 1);
  }

  const card = deck[position];
  const liveScore = answers.reduce((sum, a, i) => {
    const item = GAME_BANK[a.index];
    return item && item.verdict === a.choice ? sum + 10 + Math.min(i + 1, 5) * 2 : sum;
  }, 0);

  return (
    <>
      <div style={{ background: '#13150d', borderRadius: 24, padding: 26, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 30, letterSpacing: '-.02em', color: 'var(--primary)', margin: 0 }}>
              Signal Rush
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 15, color: 'rgba(255,255,255,.72)', maxWidth: '52ch' }}>
              Thirty seconds. Accept the real builder updates, bounce the hype. It is the filter&apos;s job, done by hand.
            </p>
          </div>
          {running ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 44, letterSpacing: '-.03em', color: timeLeft <= 5 ? '#ef5a60' : 'var(--primary)' }}>
                {timeLeft}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>seconds · {liveScore} pts</div>
            </div>
          ) : null}
        </div>
      </div>

      {!running && !done ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: 'var(--elev)' }}>
          <p style={{ margin: '0 0 6px', font: '700 18px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
            {personalBest > 0 ? `Your best is ${personalBest} points.` : 'Ready when you are.'}
          </p>
          <p style={{ margin: '0 0 22px', fontSize: 15, color: 'var(--body)' }}>Correct calls score 10, and a streak scores more.</p>
          <button
            onClick={start}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              borderRadius: 9999,
              padding: '15px 34px',
              font: '700 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Start the round
          </button>
        </div>
      ) : null}

      {running && card ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 26, boxShadow: 'var(--elev)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: card.color,
                color: '#fff',
                font: '800 15px/1 var(--font-manrope), Manrope',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {card.initials}
            </span>
            <span style={{ font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{card.name}</span>
          </div>

          <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--ink)', margin: '20px 0 24px' }}>{card.text}</p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => answer('accept')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: 'rgba(46,173,75,.12)',
                color: 'var(--positive)',
                border: '1.5px solid rgba(46,173,75,.35)',
                borderRadius: 16,
                padding: '16px',
                font: '700 15px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              <CheckIcon size={18} />
              Accept
            </button>
            <button
              onClick={() => answer('bounce')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: 'rgba(208,50,56,.1)',
                color: 'var(--negative)',
                border: '1.5px solid rgba(208,50,56,.32)',
                borderRadius: 16,
                padding: '16px',
                font: '700 15px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              <CrossIcon size={18} />
              Bounce
            </button>
          </div>

          {flash ? (
            <div
              role="status"
              style={{
                marginTop: 16,
                borderRadius: 14,
                padding: '13px 16px',
                fontSize: 14.5,
                lineHeight: 1.45,
                background: flash.correct ? 'rgba(46,173,75,.1)' : 'rgba(208,50,56,.08)',
                color: 'var(--ink)',
                animation: 'sl-up .18s ease both',
              }}
            >
              <b style={{ color: flash.correct ? 'var(--positive)' : 'var(--negative)' }}>{flash.correct ? 'Correct.' : 'Missed.'}</b>{' '}
              {flash.why}
            </div>
          ) : null}
        </div>
      ) : null}

      {done ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 34, textAlign: 'center', boxShadow: 'var(--elev)' }}>
          <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 52, letterSpacing: '-.03em', color: 'var(--ink)' }}>
            {result?.score ?? '…'}
          </div>
          <p style={{ margin: '4px 0 18px', fontSize: 15, color: 'var(--body)' }}>
            {result ? `${result.solved} right, ${result.missed} missed.` : 'Saving your run…'}
          </p>
          <button
            onClick={start}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              borderRadius: 9999,
              padding: '14px 30px',
              font: '700 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Play again
          </button>
        </div>
      ) : null}

      {leaderboard.length > 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 22, boxShadow: 'var(--elev)' }}>
          <h2 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>Leaderboard</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.map((row, i) => (
              <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--soft)', borderRadius: 14, padding: '11px 14px' }}>
                <span style={{ width: 22, font: '800 14px/1 var(--font-manrope), Manrope', color: 'var(--mute)', flexShrink: 0 }}>{i + 1}</span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9999,
                    background: row.user.avatarColor,
                    color: '#fff',
                    font: '800 13px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {row.user.initials}
                </span>
                <span style={{ flex: 1, minWidth: 0, font: '600 14px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                  {row.user.name}
                </span>
                <span style={{ font: '800 15px/1 var(--font-manrope), Manrope', color: 'var(--ink)', flexShrink: 0 }}>{row.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
