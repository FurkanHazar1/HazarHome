"use client";

import { useEffect } from "react";

export default function Announcment() {
  useEffect(() => {
    var closeAnnouncement = function () {
      document
        .querySelectorAll(".close-announcement-bar")
        .forEach(function (btn) {
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            var announcementBar = this.closest(".announcement-bar");
            var height = announcementBar.offsetHeight + "px";

            announcementBar.style.marginTop = `-${height}`;

            setTimeout(function () {
              announcementBar.style.display = "none";
              announcementBar.remove();
            }, 600); // Simulating fadeOut with a timeout
          });
        });
    };
    closeAnnouncement();
  }, []);
  return (
    <div className="announcement-bar bg_primary not-hover">
      <div className="wrap-announcement-bar">
        <div className="box-sw-announcement-bar speed-1">
          <div className="announcement-bar-item">
            <p>DÜNYANIN HER YERİNE ÜCRETSİZ KARGO</p>
          </div>
          <div className="announcement-bar-item">
            <p>YENİ SEZON, YENİ STİLLER: KAÇIRMAYACAĞINIZ  İNDİRİMİ</p>
          </div>
          <div className="announcement-bar-item">
            <p>DÜNYANIN HER YERİNE ÜCRETSİZ KARGO</p>
          </div>
          <div className="announcement-bar-item">
            <p>YENİ SEZON, YENİ STİLLER: KAÇIRMAYACAĞINIZ  İNDİRİMİ</p>
          </div>
         
          <div className="announcement-bar-item">
            <p>DÜNYANIN HER YERİNE ÜCRETSİZ KARGO</p>
          </div>
         
          
          <div className="announcement-bar-item">
            <p>YENİ SEZON, YENİ STİLLER: KAÇIRMAYACAĞINIZ  İNDİRİMİ</p>
          </div>
         
          
        </div>
      </div>
      <span className="icon-close close-announcement-bar" />
    </div>
  );
}
