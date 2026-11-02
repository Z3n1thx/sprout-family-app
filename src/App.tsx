import { Navigate, Route, Routes } from 'react-router-dom';
import { IconSprite } from './ui/Icons';
import Welcome from './screens/Welcome';
import Setup from './screens/Setup';
import Join from './screens/Join';
import ChildPicker from './child/ChildPicker';
import PictureKey from './child/PictureKey';
import ChildFrame, { ChildTabs } from './child/ChildFrame';
import Home from './child/Home';
import Jobs from './child/Jobs';
import JobDetail from './child/JobDetail';
import Goals from './child/Goals';
import Rewards from './child/Rewards';
import RewardDetail from './child/RewardDetail';
import Badges from './child/Badges';
import Story from './child/Story';
import Spend from './child/Spend';
import SignIn from './parent/SignIn';
import ParentFrame from './parent/ParentFrame';
import FamilyHome from './parent/FamilyHome';
import Review from './parent/Review';
import AddCoins from './parent/AddCoins';
import JobsAdmin from './parent/JobsAdmin';
import NewJob from './parent/NewJob';
import RewardsAdmin from './parent/RewardsAdmin';
import Insights from './parent/Insights';
import Family from './parent/Family';
import ChildProfile from './parent/ChildProfile';
import NewChild from './parent/NewChild';
import Devices from './parent/Devices';

export default function App() {
  return (
    <>
      <IconSprite />
      <div className="stage">
        <div className="frame">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/join" element={<Join />} />

            {/* Child. The picture key is checked at the frame, so a bookmarked
                deep link cannot skip it. */}
            <Route path="/child" element={<ChildPicker />} />
            <Route path="/child/:id/key" element={<PictureKey />} />
            <Route path="/child/:id" element={<ChildFrame />}>
              <Route element={<ChildTabs />}>
                <Route index element={<Home />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="goals" element={<Goals />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="story" element={<Story />} />
              </Route>
              <Route path="jobs/:jobId" element={<JobDetail />} />
              <Route path="rewards/:rewardId" element={<RewardDetail />} />
              <Route path="badges" element={<Badges />} />
              <Route path="spend" element={<Spend />} />
            </Route>

            {/* Parent */}
            <Route path="/parent/sign-in" element={<SignIn />} />
            <Route path="/parent" element={<ParentFrame />}>
              <Route index element={<FamilyHome />} />
              <Route path="queue/:kind/:itemId" element={<Review />} />
              <Route path="add-coins" element={<AddCoins />} />
              <Route path="add-coins/:childId" element={<AddCoins />} />
              <Route path="jobs" element={<JobsAdmin />} />
              <Route path="jobs/new" element={<NewJob />} />
              <Route path="rewards" element={<RewardsAdmin />} />
              <Route path="insights" element={<Insights />} />
              <Route path="children" element={<Family />} />
              <Route path="children/new" element={<NewChild />} />
              <Route path="children/:childId" element={<ChildProfile />} />
              <Route path="devices" element={<Devices />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}
