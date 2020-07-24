import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {fromEvent} from 'rxjs';
import {pairwise, switchMap, takeUntil} from 'rxjs/operators';


interface TouchPosition {
    x: number;
    y: number;
}

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements AfterViewInit {
    @ViewChild('signatureCanvas') public signatureCanvas: ElementRef<HTMLCanvasElement>;
    base64Content: string;
    private cx: CanvasRenderingContext2D;
    private canvasEl: HTMLCanvasElement;

    constructor(private platform: Platform,
                private splashScreen: SplashScreen,
                private statusBar: StatusBar) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });
    }

    public ngAfterViewInit() {
        this.canvasEl = this.signatureCanvas.nativeElement;
        this.cx = this.canvasEl.getContext('2d');
        this.canvasEl.width = this.platform.width();
        this.canvasEl.height = this.platform.height() * 0.8;

        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000000';

        this.captureEvents();
    }

    saveImage() {
        this.base64Content = this.signatureCanvas.nativeElement.toDataURL();
        console.log(this.base64Content);
    }

    clearSignature() {
        this.cx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        this.base64Content = '';
    }

    private captureEvents() {
        fromEvent(this.canvasEl, 'touchstart')
            .pipe(
                switchMap(() => fromEvent(this.canvasEl, 'touchmove')
                    .pipe(
                        takeUntil(fromEvent(this.canvasEl, 'touchleave')),
                        pairwise() /* Return the previous and last values as array */
                    )
                )
            ).subscribe((touchEvents: [TouchEvent, TouchEvent]) => {
            const rect = this.canvasEl.getBoundingClientRect();
            const touchPositions: TouchPosition[] = touchEvents.map(te => ({
                x: te.touches[0].clientX - rect.left,
                y: te.touches[0].clientY - rect.top
            }));
            this.drawOnCanvas(touchPositions[0], touchPositions[1]);
        });
    }

    private drawOnCanvas(prevPos: TouchPosition, currentPos: TouchPosition) {
        if (!this.cx) {
            return;
        }

        this.cx.beginPath();

        if (prevPos) {
            this.cx.moveTo(prevPos.x, prevPos.y); // from
            this.cx.lineTo(currentPos.x, currentPos.y);
            this.cx.stroke();
        }
    }
}
