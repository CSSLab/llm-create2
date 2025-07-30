import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import './index.css';
import { Provider } from './components/ui/provider';
import Captcha from './pages/Captcha';
import ConsentForm from './pages/ConsentForm';
import AristPreSurvey from './pages/artist/PreSurvey';
import ArtistInstructions from './pages/artist/instructions/Instructions';
import ArtistTransitionStep1 from './pages/artist/step1/TransitionStep1';
import ArtistStep1 from './pages/artist/step1/Step1';
import ArtistTransitionStep2 from './pages/artist/step2/TransitionStep2';
import ArtistStep2 from './pages/artist/step2/Step2';
import ArtistPostSurvey from './pages/artist/PostSurvey';
import ThankYou from './pages/ThankYou';
import ChooseYourCharacter from './pages/ChooseYourCharacter';
import AudiencePreSurvey from './pages/audience/PreSurvey';
import AudienceInstructions from './pages/audience/instructions/Instructions';
import AudienceTransitionStep1 from './pages/audience/step1/TransitionStep1';
import AudienceStep1 from './pages/audience/step1/Step1';
import AudienceStep2 from './pages/audience/step2/Step2';
import AudienceTransitionStep2 from './pages/audience/step2/TransitionStep2';
import AudiencePostSurvey from './pages/audience/PostSurvey';



function App() {
  return (
    <Provider>
      <div className="w-screen h-screen"> 
      <Router>
        <Routes>
          <Route path="/" element={<Captcha/>}/>
          <Route path="/consent" element={<ConsentForm/>}/>

          <Route path="/artist/pre-survey" element={<AristPreSurvey />} />
          <Route path="/audience/pre-survey" element={<AudiencePreSurvey />} />

          <Route path="/artist/instructions" element={<ArtistInstructions/>} />
          <Route path="/audience/instructions" element={<AudienceInstructions />} />

          <Route path="/artist/step-1" element={<ArtistTransitionStep1 />} />
          <Route path="/artist/brainstorm" element={<ArtistStep1/>} />
          <Route path="/artist/step-2" element={<ArtistTransitionStep2/>} />
          <Route path="/artist/blackout" element={<ArtistStep2 />} />

          <Route path="/audience/step-1" element={<AudienceTransitionStep1 />} />
          <Route path="/audience/read" element={<AudienceStep1 />} />
          <Route path="/audience/step-2" element={<AudienceTransitionStep2 />} />
          <Route path="/audience/poem-surveys" element={<AudienceStep2 />} />
          
          <Route path="/artist/post-survey" element={<ArtistPostSurvey/>} />
          <Route path="/audience/post-survey" element={<AudiencePostSurvey />} />

          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/choice" element={<ChooseYourCharacter />} />
        </Routes>
      </Router>
      </div>
    </Provider>
  )
}

export default App
