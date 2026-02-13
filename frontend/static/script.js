import Home from './components/home.js'
import Login from './components/login.js'
import Register from './components/register.js'
import Footer from './components/Footer.js'
import Navbar from './components/Navbar.js'
import dashboard from './components/dashboard.js'
import admin_dashboard from './components/admin_dashboard.js'
import user_nav from './components/user_nav.js'
import admin_nav from './components/admin_nav.js'
import admin_quiz from './components/admin_quiz.js'
import summary from './components/summary.js'
import scores from './components/scores.js'
import admin_summary from './components/admin_summary.js'
import exam from './components/exam.js'

const routes =[
    {path: '/', component: Home},
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/dashboard', component: dashboard},
    {path: '/admin_dashboard', component: admin_dashboard},
    {path: '/admin_quiz', component: admin_quiz},
    {path: '/summary', component: summary},
    {path: '/scores', component: scores},
    {path: '/admin_summary', component: admin_summary},
    {path: '/exam/:quizId/:chapterId', name:'exam',component: exam,props: true},
]


const router = new VueRouter({
    routes
})


const app = new Vue({
    el: "#app",
    router,
    data: {
        navComponent: "navbar", // Default component
        searchQuery: ""
      },
      created() {
        const token = localStorage.getItem("auth_token");
        const isAdmin = localStorage.getItem("is_admin") === "1";
        const path = this.$route.path;

        if (path.includes('/exam')) {
          this.navComponent = null;
          this.Footer = null; // Hide footer in quiz
        } else if (!token || ["/", "/login", "/register"].includes(path)) {
          this.navComponent = "navbar";
        } else {
          this.navComponent = isAdmin ? "admin_nav" : "user_nav";
    
          if (isAdmin && path === "/dashboard") {
            this.$router.push("/admin_dashboard");
          }
          if (!isAdmin && path === "/admin_dashboard") {
            this.$router.push("/dashboard");
          }
          if (!isAdmin && path === '/admin_quiz') {
            this.$router.push('/dashboard');
          }
        }
    
        if (!token && ["/dashboard", "/admin_dashboard"].includes(path)) {
          this.$router.push("/login");
        }
      },
      methods: {
        updateSearch(query) {
          this.searchQuery = query;
        }
      },
      watch: {
        '$route.path': function (newPath) {
          const token = localStorage.getItem("auth_token");
          const isAdmin = localStorage.getItem("is_admin") === "1";
      
          if (newPath.includes('/exam')) {
            this.navComponent = null; 
          } else if (!token || ["/", "/login", "/register"].includes(newPath)) {
            this.navComponent = "navbar";
          } else {
            this.navComponent = isAdmin ? "admin_nav" : "user_nav";
    
            if (isAdmin && newPath === '/dashboard') {
              this.$router.push('/admin_dashboard');
            }
            if (!isAdmin && newPath === '/admin_dashboard') {
              this.$router.push('/dashboard');
            }
            if (!isAdmin && newPath === '/admin_quiz') {
              this.$router.push('/dashboard');
            }
          }
        }
      },
    template: `
    <div class="d-flex flex-column min-vh-100">
      <component :is="navComponent" @search-change="updateSearch"></component>
      <main class="flex-grow-1">
        <router-view :searchQuery="searchQuery"></router-view>
      </main>
      <footer-bar></footer-bar>
    </div>
  
  `,
    components: {
        'navbar': Navbar,
        'user_nav': user_nav,
        'admin_nav': admin_nav,
        'footer-bar': Footer
    },
})


