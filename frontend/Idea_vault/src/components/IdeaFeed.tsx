import { IdeaCard } from './IdeaCard';

export function IdeaFeed({ ideas = [], onUpdate, onDelete }: any) {
  if (!ideas || ideas.length === 0) return <p>No ideas yet. Do a brain dump above!</p>;

  return (
    <div>
      {ideas.map((idea: any) => (
        <IdeaCard key={idea.id} idea={idea} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
