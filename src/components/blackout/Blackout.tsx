import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { RiEyeCloseLine } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { MdOutlineRestartAlt } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";




const BlackoutPoetry: React.FC = () => {
  const [passageText] = useState("Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear.")
  const words = passageText.split(' ');
  const [selectedWords, setSelectedWords] = useState<boolean[]>(
    Array(words.length).fill(false)
  );
  const [viewMode, setViewMode] = useState<'edit' | 'blackout'>('edit');


  const copyPassage = () => {
    navigator.clipboard.writeText(passageText);
  };


  const toggleSelect = (index: number) => {
    if (viewMode === 'edit') {
      const updated = [...selectedWords];
      updated[index] = !updated[index];
      setSelectedWords(updated);
    }
  };

  const resetSelection = () => {
    setSelectedWords(Array(words.length).fill(false));
  };

  return (
    <div className="w-full h-max flex flex-col space-y-6">
        <div className="w-full h-max flex flex-row space-x-2">
            <Button className={viewMode === 'edit' ? 'btn-small-inverted' : 'btn-small'} onClick={() => setViewMode(viewMode === 'edit' ? 'blackout' : 'edit')}>{viewMode === 'edit' ? <RiEyeCloseLine /> : <MdOutlineEdit />}{viewMode === 'edit' ? 'View Blackout' : 'Back to Editing'}</Button>
            <Button className="btn-small-inverted" onClick={() => resetSelection()}><MdOutlineRestartAlt/> Reset poem</Button>
            <Button className="btn-small-inverted" onClick={() => copyPassage()}><MdContentCopy/></Button>
        </div>
    

      <div className="py-6 leading-relaxed flex flex-wrap">
        {words.map((word, i) => {
          const isSelected = selectedWords[i];

          const textColor =
            viewMode === 'blackout'
              ? isSelected
                ? 'text-main'
                : 'text-main bg-dark-grey'
              : isSelected
              ? 'text-main text-light-grey-1 underline'
              : 'text-main bg-transparent';

          return (
            <span
              key={i}
              onClick={() => toggleSelect(i)}
              className={`cursor-pointer transition px-1 duration-200 ${textColor}`}
            >
              {word + ` `}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default BlackoutPoetry;
