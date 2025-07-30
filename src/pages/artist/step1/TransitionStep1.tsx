import PageTemplate from '../../../components/shared/pages/page';
import { useNavigate } from 'react-router-dom';


const ArtistTransitionStep1 = () => {
    const navigate = useNavigate();

    const handleSubmit = () => {
         navigate("/artist/brainstorm")
    }

    return (
       <PageTemplate background="bg4"  nextButton={{text: 'Next', action: handleSubmit}}>
        <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
            <p className="text-h1-dark w-80">Are you ready to begin Step 1: Brainstorm?</p>
            <p className="text-main-dark w-80 text-light-grey-1 text-sm">This is your time to familiarize yourself with the text and brainstorm for your poem.</p>
            <p className="text-main-dark w-80 text-light-grey-1 text-sm">You will have 5 minutes for this task.</p>
        </div>
       </PageTemplate>
    );
};

export default ArtistTransitionStep1;
