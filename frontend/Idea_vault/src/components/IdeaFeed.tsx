import { IdeaCard } from './IdeaCard';

export function IdeaFeed({ ideas = [], onUpdate, onDelete, currentUserId, token }: any) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <div>
      {ideas.map((idea: any, index: number) => (
        <IdeaCard
          key={idea.id || index}
          idea={idea}
          onUpdate={onUpdate}
          onDelete={onDelete}
          currentUserId={currentUserId}
          token={token}
        />
      ))}
    </div>
  );
}
