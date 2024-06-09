import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'photo-upload-app';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const oauthToken = params['oauth_token'];
      const userId = params['user_id'];

      if (oauthToken && userId) {
        localStorage.setItem('oauth_token', oauthToken);
        localStorage.setItem('user_id', userId);
      }
    });
  }
}
