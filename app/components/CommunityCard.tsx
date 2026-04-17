import { MessageSquare } from 'lucide-react';
import { Button } from './Button';

type CommunityCardProps = {
  memberCount?: number;
  onOpenCommunity?: () => void;
};

export const CommunityCard = ({
  memberCount = 3,
  onOpenCommunity,
}: CommunityCardProps) => {
  return (
    <section className='rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.18)]'>
      <h2 className='mb-6 font-serif text-3xl text-[#1a1a1a]'>Community</h2>
      <div className='mb-6 flex items-center gap-4'>
        <div className='flex -space-x-2'>
          {[1, 2, 3].map((i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/100?u=${i + 10}`}
              className='h-10 w-10 rounded-full border-2 border-white shadow-sm'
              alt='User'
            />
          ))}
        </div>
        <span className='text-sm font-medium text-black/60'>
          Join active discussions
        </span>
      </div>
      <Button
        variant='outline'
        className='w-full justify-center'
        onClick={onOpenCommunity}
      >
        <MessageSquare size={18} />
        Open Community Space
      </Button>
    </section>
  );
};
