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
        // <PageTemplate background='bg3' title='Step 2: Blackout' description='Write a blackout poem by selecting words in the passage. Let your imagination run wild!' nextButton={{text:"Submit", action: onComplete }}>
        //     <div className="w-full h-full flex flex-col md:flex-row md:space-x-12">

        //     <div className="w-full md:w-1/2 h-full">
        //          <BlackoutPoetry/>
        //     </div>

        //     <div className="w-full md:w-1/2 h-full">
        //         <Tabs.Root lazyMount unmountOnExit defaultValue="tab-1" className="w-full h-full">
        //             <Tabs.List className="space-x-4">
        //                 <Tabs.Trigger value="tab-1">Notes</Tabs.Trigger>
        //                             {(userType === 'WRITING' || userType === 'TOTAL_ACCESS'
        //     ) && (
        //                 <Tabs.Trigger value="tab-2">LLM</Tabs.Trigger>
        //     )}
        //             </Tabs.List>
        //             <Tabs.Content value="tab-2" className="w-full h-4/5">
        //                <ChatTab />
        //             </Tabs.Content>
        //             <Tabs.Content value="tab-1" className="w-full h-4/5">
        //                 <Textarea
        //                     value={notes}
        //                     onChange={(e) => setNotes(e.target.value)}
        //                     placeholder="Take some notes..."
        //                     className="text-main h-full flex-1 px-3 py-2 border rounded-md focus:outline-none focus:border-2 focus:border-grey"
        //                 />
        //             </Tabs.Content>
        //             </Tabs.Root>
  

        //     </div>
        //     </div>
           

        // </PageTemplate>


       

       
    );
};

export default ArtistStep2;
