import { Head } from '@/components/seo';
import { AIChatPage } from '@/features/ai-chat/components/ai-chat-page';

const AiResearchRoute = () => {
  return (
    <>
      <Head title="AI Research" />
      <AIChatPage />
    </>
  );
};

export default AiResearchRoute;
