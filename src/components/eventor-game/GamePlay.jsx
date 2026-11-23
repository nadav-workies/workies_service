import GameMessage from "@/components/eventor-game/GameMessage";
import GameQuestion from "@/components/eventor-game/GameQuestion";

export default function GamePlay({ game, player, onPlayer }) {
  if (game.phase === "waiting") return <GameMessage title={`שלום ${player.name}`}>המשחק יתחיל בעוד רגע. השאלה הראשונה תופיע כאן ברגע שנדב יפתח אותה.</GameMessage>;
  if (game.phase === "ended") return <GameMessage title="תודה על ההשתתפות!">התוצאות מוצגות כעת בהרצאה.</GameMessage>;
  const qi = game.question_index;
  const answered = player.answers?.[qi] != null;
  if (game.phase === "open" && !answered) return <GameQuestion key={qi} qi={qi} player={player} onPlayer={onPlayer} />;
  return answered
    ? <GameMessage title="התשובה נקלטה">אפשר להסתכל על המסך המרכזי.</GameMessage>
    : <GameMessage title="ההצבעה הסתיימה">התוצאות מוצגות על המסך. השאלה הבאה תופיע כאן.</GameMessage>;
}