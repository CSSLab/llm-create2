// import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import HalfPageTemplate from '../components/shared/pages/halfPage';
// import { Button, Input } from '@chakra-ui/react';
import { Collapsible, Icon, Image } from '@chakra-ui/react';
import PageTemplate from '../../../components/shared/pages/page';
import { useNavigate } from 'react-router-dom';
import { MdInfoOutline } from "react-icons/md";
import { MdOutlineAccessTime } from "react-icons/md";



const ArtistInstructions = () => {
    const navigate = useNavigate();

    const handleSubmit = () => {
         navigate("/artist/step-1")
    }

    return (
       <PageTemplate title='Your Task' background='bg2' nextButton={{text: 'Next', action: handleSubmit}}>
        <div className="w-full h-full flex-col space-y-6">
         <div className="text-main mb-2">
            The goal of this experiment is for you to <strong>write a blackout poem.</strong> <Collapsible.Root unmountOnExit>
                <Collapsible.Trigger  className="text-main underline italic text-light-grey-1 pt-2">
                <div className="flex flex-row items-center space-x-2">
                    <Icon className="w-4 h-4 fill-light-grey-1">
                        <MdInfoOutline />
                    </Icon>
                    <p>What is a blackout poem?</p>

                </div>
                
                </Collapsible.Trigger>
                <Collapsible.Content>
                    <div className="w-full h-max p-4 mt-3 border rounded-lg border-light-grey-2">
                        <p className="text-main">
                            <strong className="italic">Blackout poetry</strong> involves <strong>blacking out words</strong> from an existing piece of text <strong>to create a new poem</strong>.
                        </p>
                        <p className="text-main pt-1">Here are two examples of blackout poetry made using the same piece of text: </p>
                        <div className="w-full h-max flex flex-col md:flex-row">
                            <Image alt="Blackout Example 1" src="/src/assets/blackout1.png" className="w-72"/>
                            <Image alt="Blackout Example 2" src="/src/assets/blackout2.png" className="w-72"/>
                        </div>
                    </div>
                </Collapsible.Content>
            </Collapsible.Root>
          </div>
        <div>
         <p className="text-main mb-2">
            The task involves two steps:
         </p>
             <ul className="list-disc mb-4 pl-6 space-y-4">
                <li className="text-main">
                    <strong>Step 1: Brainstorm</strong> 
                    <div className="flex flex-row items-center space-x-2">
                        <Icon className="w-4 h-4 fill-grey">
                            <MdOutlineAccessTime />
                        </Icon>
                        <p className="text-main text-grey">5 minutes</p>
                    </div> 
                    <p className="text-main">You will be given a piece of text but you cannot start writing. This is your time to familiarize yourself with the text and brainstorm for your poem.</p>

                </li>
                <li className="text-main">
                    <strong>Step 2: Blackout</strong> 
                    <div className="flex flex-row items-center space-x-2">
                        <Icon className="w-4 h-4 fill-grey">
                            <MdOutlineAccessTime />
                        </Icon>
                        <p className="text-main text-grey"> No time limit! </p>
                    </div> 
                    <p className='text-main'>You will write the blackout poem. Let your imagination run wild!</p>
                </li>

             </ul>
            </div>
        </div>

       </PageTemplate>
    );
};

export default ArtistInstructions;
