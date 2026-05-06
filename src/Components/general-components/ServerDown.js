import React from "react";
import '../../Styles/general-styles/ServerDown.css';
import ServerDownImg from '../../Images/ServerDown.png';
import { HiMiniArrowUturnLeft } from "react-icons/hi2";
const ServerDown = () => {
    return (
        <div className="server-down-main-div">
            <div className="server-down-popup">
                <div className="server-down-h">
                    We're Just Doing a Quick Tune-Up!
                </div>
                <div className="server-down-p">
                    Apologies the portal is under routine <br />maintenance and will be back soon.
                </div>
                <div className="serverDownImgDiv">
                    <img src={ServerDownImg} alt="ServerDown" className="serverDownimg" />
                </div>
                <div className="button-divs">
                    <button className="retry-btn" onClick={() => window.location.href = 'https://www.curki.ai/'}>
                        <HiMiniArrowUturnLeft /> Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServerDown;