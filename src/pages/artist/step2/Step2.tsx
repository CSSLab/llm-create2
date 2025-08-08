import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MultiPageTemplate from '../../../components/shared/pages/multiPage';
import BlackoutPoetry from '../../../components/blackout/Blackout';
import { ArtistCondition } from '../../../types';

const ArtistStep2 = () => {
    const navigate = useNavigate();
    const [userType] =  useState<ArtistCondition>('TOTAL_ACCESS')
    

    const onComplete = () => {
        navigate('/artist/post-survey');
    }

    return (
        <MultiPageTemplate 
            title="Step 2: Blackout"
            description='Create a poem by clicking on words in the passage.'
            llmAccess={(userType=='TOTAL_ACCESS' || userType=='WRITING')}
        >
            <div className="h-max w-full flex flex-col justify-between">
                 <BlackoutPoetry onSubmit={onComplete}/>
            </div>

        </MultiPageTemplate>
    );
};

export default ArtistStep2;
