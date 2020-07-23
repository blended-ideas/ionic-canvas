import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {fromEvent} from 'rxjs';
import {pairwise, switchMap, takeUntil} from 'rxjs/operators';
import {Platform} from '@ionic/angular';

interface TouchPosition {
    x: number;
    y: number;
}

@Component({
    selector: 'app-folder',
    templateUrl: './folder.page.html',
    styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements AfterViewInit {
    @ViewChild('signatureCanvas') public signatureCanvas: ElementRef<HTMLCanvasElement>;
    private cx: CanvasRenderingContext2D;

    constructor(private platform: Platform) {

    }

    public ngAfterViewInit() {
        const canvasEl: HTMLCanvasElement = this.signatureCanvas.nativeElement;
        this.cx = canvasEl.getContext('2d');

        console.log(this.platform.width(), this.platform.height());
        canvasEl.width = this.platform.width();
        canvasEl.height = this.platform.height() - 44;

        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000000';

        this.captureEvents(canvasEl);
    }

    saveImage() {
        const dataURL = this.signatureCanvas.nativeElement.toDataURL();
        console.log(dataURL);
    }

    private captureEvents(canvasEl: HTMLCanvasElement) {
        fromEvent(canvasEl, 'touchstart')
            .pipe(
                switchMap((e) => fromEvent(canvasEl, 'touchmove')
                    .pipe(
                        takeUntil(fromEvent(canvasEl, 'touchleave')),
                        pairwise() /* Return the previous and last values as array */
                    )
                )
            ).subscribe((touchEvents: [TouchEvent, TouchEvent]) => {
            const rect = canvasEl.getBoundingClientRect();
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
