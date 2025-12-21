import { PixelRatio } from 'react-native';


export const base_url = "https://api.astrobook.co.in/";
export const img_url = "https://api.astrobook.co.in/uploads/";
export const SUPER_BASE_URL = "https://alb.gennextit.com";
// export const SUPER_BASE_URL = "http://192.168.1.16:4000"
export const api_url = `${SUPER_BASE_URL}/api/`;

// live server

// export const base_url = "https://api.astrobook.co.in/";`
// export const img_url = "https://api.astrobook.co.in/uploads/";
// export const api_url = "https://api.astrobook.co.in/api/";

// export const img_url2 = 'http://194.238.17.230:4000/'
export const Shivam_Api_Url = "https://kundli2.astrosetalk.com/api/" ; 

export const KP_PLANETS = "kp/get_all_planet_data"

export const KP_Birth_Detailes='kp/kp_birth_data'

export const KP_RULING = "kp/get_ruling_planets"
export const get_kundli_basic_details = 'kundli/get_kundli_basic_details';


export const get_assigned_Puja = 'ecommerce/get_astrologer_registered_puja'
export const get_astrologer_assigned_Puja = 'puja/get_assign_by_astrologer'
export const get_complete_Puja = 'ecommerce/get_astrologer_complete_puja'
export const get_delete_accoount = 'astrologer/delete_account'
export const get_notification_data = 'astrologer/astrologer_notification_by_id'
export const endvidocall = 'customers/endvidocall';
export const get_splash = 'astrologer/get_splash';
export const astrologer_login = 'astrologer/astrologer_login';
export const logout_astrologer = 'astrologer/logout_astrologer';
export const initate_live_streaming = 'customers/initate_live_streaming';
export const change_call_status = 'astrologer/change-call-status'
export const change_chat_status = 'astrologer/change-chat-status'
export const change_vedio_call_status = 'astrologer/change-video-call-status'
export const store_file = 'customers/store-file';
export const get_linked_profile = 'customers/get_linked_profile';
export const get_queue_data = 'customers/get_astrologer_queues';
export const get_message_list = 'customers/get_astrologer_message';
export const get_suggested_data = 'puja/add_suggested_remedies';
export const get_message_data = 'customers/get_completed_queues';
export const get_updated_queue_data = 'customers/update_queue_status';
export const get_predefined_message = 'admin/get_predefined_message';
export const astrologer_call_history = 'astrologer/astrologer-call-history';
export const astrologers_chat_history = 'astrologer/astrologers-chat-history';
export const astrologer_wallet_history = 'astrologer/astrologer_wallet_history';
export const get_astrolgoer_live_calls = 'astrologer/get_astrolgoer_live_calls';
export const get_video_call_history = 'astrologer/get_astrologer_videocalls';
export const get_status_online = 'astrologer/online_status';
export const get_status_offline = 'astrologer/online_status';
export const get_gift_order_history = 'admin/get_astrologer_gift_history';
export const get_astrolgoer_followers = 'astrologer/get_astrolgoer_followers';
export const get_verified_astrologer_review =
  'admin/get-verified-astrologer-review';
export const update_next_online = 'astrologer/update_next_online';
export const add_astrologer_inquiry = 'astrologer/add-astrologer-inquiry';
export const get_astrologer_announcement = 'astrologer/get_astrologer_announcement';
export const on_read_announcement = 'astrologer/on_read_announcement';
export const get_pooja = 'ecommerce/get_pooja';
export const register_pooja = 'ecommerce/register_pooja';
export const get_astrologer_registered_pooja = 'ecommerce/get_astrologer_registered_pooja';
export const complete_astrologer_pooja = 'ecommerce/complete_astrologer_pooja';

export const get_new_pooja_category = 'ecommerce/get_puja_category'



export const user_web_api_login = 'user_web_api/login?';
export const api2_get_countries = 'api2/get_countries';
export const api2_get_state = 'api2/get_state';
export const user_web_api_verification_otp = 'user_web_api/verification_otp?';
export const signup_google = 'user_web_api/signup_google';
export const user_get_banner = 'user/get_banner.php';
export const api_astrolist1 = 'api/astrolist1';
export const api_astrodetails = 'api/astrodetails';
export const user_review = 'user/review.php?';
export const api_callintakesubmit = 'api/callintakesubmit';
export const api_callintake = 'api/callintake';
export const api_getastrochatstatus = 'api/getastrochatstatus';
export const api2_get_profile = 'api2/get_profile';
export const api_getRechargeplans = 'api/getRechargeplans';
export const user_chat_in = 'user/chat_in.php';
export const kundli_get_kundli = 'kundli/get_kundli';
export const api2_logout = 'api2/logout';
export const api_addwallet = 'api/addwallet';
export const api2_tarot_cards = 'api2/tarot_cards';
export const api_addreview = 'api/addreview';
export const api2_customer_date_profile = 'api2/customer_date_profile';
export const api2_is_customer_register = 'api2/is_customer_register';
export const api2_all_users = 'api2/all_users';
export const api2_myplans = 'api2/myplans';
export const api2_astrodate_plans = 'api2/astrodate_plans';
export const api2_subscriptions_purchase = 'api2/subscriptions_purchase';
export const api2_create_kundali = 'api2/create_kundali';
export const api2_my_kundali = 'api2/my_kundali';
export const kundli_get_panchang = 'kundli/get_panchang';
export const api2_get_chart = 'api2/get_chart';
export const api2_get_chart_web = 'api2/get_chart_webpg';
export const kundli_get_planets1 = 'api2/get_planets';
export const kundli_get_planets = 'kundli/get_planets';
export const add_or_update_device_token =
  'Api_astro/add_or_update_device_token';
export const upload_customer_pic = 'user_web_api/upload_customer_pic';
export const accept_chat = 'api/accept_chat';
export const match_making = 'api2/match_making';
export const get_horoscope = 'api2/get_horoscope';
export const deductwallet = 'api/deductwallet';
export const order_history = 'api/order_history';
export const get_city = 'api2/get_city';
export const get_tarot_card_detail = 'api2/get_tarot_card_detail';
export const blog = 'api2/blog';
export const boost_profile = 'api2/boost_profile';
export const all_request = 'api2/all_request';
export const liked_me = 'api2/liked_me';
export const liked = 'api2/liked';
export const recommended_friends = 'api2/recommended_friends';
export const api_astro_call_to_astrologer = 'api_astro/call_to_astrologer';
export const get_profile = 'api2/get_profile';
export const customer_date_profile = 'api2/customer_date_profile';
export const get_notifications = 'api/getNotifications';
export const update_notifications = 'api/updateNotifications';
export const get_customer_date_profile = 'api2/get_customer_date_profile';
export const api_paymenthistory = 'api/paymenthistory';

export const api_getfollowinglist = 'api/getfollowinglist';
export const api_follow = 'api/follow';
export const api_checkfollowing = 'api/checkfollowing';
export const about_friend = 'api2/about_friend';
export const get_gifts = 'api2/get_gifts';
export const update_like = 'api2/update_like';
export const customer_date_images_upload = 'api2/customer_date_images_upload';
export const get_customer_date_images = 'api2/get_customer_date_images';
export const update_request = 'api2/update_request';
export const set_dnd = 'api2/set_dnd';
export const get_user_details = 'api2/get_user_details'
export const send_gift = 'api2/send_gift';
export const send_friend_request = 'api2/send_friend_request';
export const get_live_list = 'api/getdata';
export const delete_kundali = 'api2/delete_kundali';
export const edit_kundali = 'api2/edit_kundali';
export const get_kundali = 'api2/get_kundali';
export const create_phonepe_order = 'api2/create_phonepe_order';
export const phonepe_react_native = 'api2/phonepe_react_native';
export const get_chart_all = 'api2/get_chart_all';
export const howtousevideos = 'api/howtousevideos';
export const whaticanask = 'api/whaticanask';
export const phonepe_success = 'api2/phonepe_success';
export const major_vdasha = 'api2/get_major_vdasha';
export const get_sub_vdasha = 'api2/get_sub_vdasha';
export const get_sub_sub_vdasha = 'api2/get_sub_sub_vdasha';
export const get_sub_sub_sub_vdasha = 'api2/get_sub_sub_sub_vdasha';
export const get_sub_sub_sub_sub_vdasha = 'api2/get_sub_sub_sub_sub_vdasha';
export const get_pdf = 'api2/get_pdf';
export const how_to_images = 'api/howtouseimages';
export const get_panchang = 'api2/get_general_report';
export const create_kundali_call = 'api2/create_kundali_call';
export const create_kundali_chat = 'api2/create_kundali_chat';
export const get_language = 'api/get_language';
export const get_skill = 'api/get_skill';
export const get_Experties_data = 'api/get_experties';
export const get_HouseReport = 'api2/get_HouseReport';
export const get_RashiReport = 'api2/get_RashiReport';
export const mark_as_read_message = 'api/mark_as_read_message';
export const update_blog = 'api2/update_blog';
export const get_youtube_astroDetails = 'api/get_youtube_astroDetails';
export const get_KpHoroscope = 'api2/get_KpHoroscope';
export const update_astro_chat = 'api/update_astro_chat';


// Astrologer
export const astrologer_dashboard = 'api/astrologer_dashboard';
export const change_status_call = 'api/changestatuscall';
export const change_status = 'api/changestatus';
export const get_following_list_astro = 'api/getfollowinglistastro';
export const create_blog = 'api2/create_blog';
export const get_blogs = 'api2/get_blogs';
export const delete_blog = 'api2/delete_blog';
export const toggle_blog = 'api2/toggle_blog';
export const astro_order_history = 'api/astroOrder_history';
export const update_intake_status = 'api/update_intake_status';
export const get_astrologer_offer = 'api2/get_astrologer_offer';
export const astrologer_offer = 'api2/astrologer_offer';
export const next_log_status = 'api/next_log_status';
export const get_boost_amount = 'api2/get_boost_amount'
export const boost_astrologer = 'api2/boost_astrologer'
export const get_astro_payments = 'api2/get_astro_payments'
export const create_live = 'api/create_live_astrologer';
export const livelist = 'api/get_astrologer_live_details';
export const astrolivehistory = 'api/astro_live_history';
export const update_live_status = 'api/update_live_status';
export const delete_live = 'api/live_delete';
export const go_live = 'api/golive';
export const exit_live = 'api/exitlive';
export const check_live = 'api/check_live';
export const mark_as_read = 'api/mark_as_read';
export const get_blogs_user = 'api2/get_blogs_user';
export const get_religion = 'api/get_religion';
export const get_dailypanchang = 'api/get_dailypanchang';
export const get_magazine = 'api/get_magazine';
export const get_birhat_horoscope = 'api/get_birhat_horoscope';
export const get_remedies_app = 'papi/get_remedies_ap';
export const get_Kpplanets = 'api2/get_Kpplanets';
export const get_KpHouseCusps = 'api2/get_KpHouseCusps';
export const get_yellow = 'api/get_yellow';
export const get_auspicions = 'api/get_auspicions';
export const get_question = 'api/get_question';
export const get_astro_details = 'api2/get_astro_details';
export const deductWallet_live_astro = 'api/deductWallet_live_astro';
export const exit_live_astro = 'api/exit_live_astro';
export const update_logout = 'api/update_logout';
export const astroleger_Withdraw = "ecommerce/get_puja";

//session
export const get_Schedule_live_session = 'customers/get-scheduled-session';
export const Schedule_live_session = 'customers/schedule-live-session';
export const Update_live_session = 'customers/update-live-session'
export const complete_live_session = 'customers/get-completed-scheduled-session'
export const Delete_live_session = 'customers/delete-live-session'
export const get_live_session_category = 'admin/get_live_session_category'
export const get_live_session_topic = 'admin/get_live_session_topic'

// ALL POOJA Data
export const get_all_pooja = "puja/get_puja";
export const get_all_assigned_pooja = "ecommerce/get_customer_booked_puja_by_astrologerId";

//Register Pooja
export const astrologer_register_puja ="puja/astro_register_for_puja"
export const get_puja_register_by_astrolgerId = "puja/get_puja_register_by_astrolgerId"

//Issue reporting

export const Issue_reporting ="astrologer/have_an_issue"

//get Language


export const Select_language ="admin/get_language"

//get expertise 

export const Main_Expertise ="admin/get-all-main-expertise"



// Mycutomer

export const My_Customer ="astrologer/get_my_customer"

//update password


export const Update_password ="astrologer/change_password"

//update phone number



export const Update_phonenumber ="astrologer/change_phone_number"

export const my_performance ="astrologer/get_astrologer_performance"




export const Update_email ="astrologer/change_email_address"

export const Update_Whatsapp ="astrologer/update_whatsapp_number"

export const Update_Bank ="astrologer/update_bank_details"  


export const Update_photo ="astrologer/change-profile"    


export const Delete_astro ="astrologer/delete_account"


export const My_Availability ="astrologer/get_astrologer_insights"    

export const My_incomes ="astrologer/get_astrologer_earning" 


export const My_Welcome ="astrologer/update_welcome_message" 
export const my_welcome_data = 'astrologer/get_astrologer_welcome_message'
//Applied Leave

export const Applied_Leave ="astrologer/create_leave_request"   

export const Astro_Leaves ="astrologer/get_leave_requests"

export const Past_Leaves ="astrologer/get_approve_leave_request"








export const Block_user ="astrologer/block_customer"

export const Favourite_user ="astrologer/mark_as_favorite"


export const google_map_key = 'AIzaSyC39FKxanlCKxkJmRz85zeg0DW0YD1AknI';

// export const google_map_key = 'AIzaSyAnqARt-OmLPXCTpKS3-jKY2SK2SwgUEWE';
// old
export const call_app_id = 1999906308;
export const call_app_sign = 'd4d7c9f488ad6e4e0e76baf0e6796b191fd650729107cc90f9bde5472240eb0c';

export const live_app_id = 2037570915;
export const live_app_sign = 'db72c30909904099cc1c17532a8fd4b74324cfb10664cbe1b214c8462e3a0137';

// export const zego_call_app_id = 1877843907
// export const zego_call_app_sign = 'abdf0d405292d6fe8ce886eda378bb8239c1fb4c56e86ecbe92e55af0103c507'  ksbm account
export const zego_call_app_id = 1643091285
export const zego_call_app_sign = '2d44e9b6b10bc81cdf5558449500bb2736cc6bdb104e5dc5429f6a7fe6219aa3'

// export const live_streaming_app_id = 1804652732;      ksbm zegocloud
// export const live_streaming_app_sign = 'cda5ae04ef3cd585a9cca284f6082c5f863172663ea961b23a7a39258f7b7aa7'; zego ksbm
export const live_streaming_app_id = 1652772840; 

export const live_streaming_app_sign = '9a104b6afe2cf94f6d6e04101a62c094286a3ab9768cde9d490fe134b30264cd';

export const zego_video_call_app_id = 1688629730;
export const zego_video_call_app_sign = 'f6629a2fdd59a03f4c289cec081d185618f3f8d254839c0edff04a241ac7d451';


//astrology api
export const API_ENDPOINT = 'horo_chart_image';
export const general_ascendant_report = 'general_ascendant_report';
export const horoscope = 'kp_horoscope';
export const basic_panchang = 'basic_panchang';
export const planets = 'planets';
export const majorvdasha = 'major_vdasha';
export const Birth_horo_chart = 'horo_chart/D1';
export const USER_ID = '626422';
export const API_KEY = 'f65e0f3730fd98faaba3ad82052af7df';

export const colors = {
  statusbar: '#381415',
  black_color: '#000',
  black_color1: '#f8f9fa',
  black_color2: '#e9ecef',
  black_color3: '#dee2e6',
  black_color4: '#ced4da',
  black_color5: '#adb5bd',
  black_color6: '#6c757d',
  black_color7: '#495057',
  black_color8: '#343a40',
  black_color9: '#212529',
  white_color: '#FFFFFF',
  grey_color: '#adb5bd',
  green_color1: '#6a994e',
  green_color2: '#29bf12',
  yellow_color1: '#ffbc42',
  yellow_color2: '#ffdab9',
  yellow_color3: '#f4a261',
  yellow_color4: '#fffae5',
  magenta_color1: '#7209b7',
  magenta_color2: '#c77dff',
  pink_color1: '#9e0059',
  pink_color2: '#fae0e4',
  pink_color3: '#ffa6c1',
  red_color1: '#ff5a5f',
  background_theme1: '#fff',
  // background_theme2: '#FA5D08',
  background_theme2: '#7F1D1D', //friendsastro
  background_theme6: '#7F1D1D',
  astrobook1: "#F1B646",
  background_theme4: '#7F1D1D',
  background_theme3: '#bdd3ff',
  orange_color: '#7d0300',
  new_color: '#F1B646'
};

export const fonts = {
  bold: 'OpenSans-Bold',
  semi_bold: 'OpenSans-SemiBold',
  medium: 'OpenSans-Medium',
  light: 'OpenSans-Light',
};

export const vedic_images = {
  logo: require('../assets/images/app_icon.png'),
  login: require('../assets/images/customer-login.jpeg'),
  flag: require('../assets/images/india-flag.jpeg'),
  provider_login: require('../assets/images/astrologer-login.png'),
  chat_background: require('../assets/images/chat_background.jpeg'),
};

export const getFontSize = (originalSize) => {

  // console.log('rsfda',PixelRatio.get())
  // if (PixelRatio.get() < 1.5) {
  //   // console.log('Pixel Ratio 1.5');
  //   return Math.round((originalSize * 0.5) * PixelRatio.get());
  // } else if (PixelRatio.get() >= 1.5 && PixelRatio.get() < 2.8) {
  //   // console.log('Pixel Ratio 1.5 2.5');
  //   return Math.round((originalSize * 3.8) * PixelRatio.get()); // 2.625
  // } else if (PixelRatio.get() >= 2.8 && PixelRatio.get() < 2.98) {
  //   // console.log('Pixel Ratio 2.5');
  //   return Math.round((originalSize * 3.5) * PixelRatio.get()); // 2.8125
  // } else if (PixelRatio.get() >= 2.98 && PixelRatio.get() < 3.05) {
  //   // console.log('Pixel Ratio 2.5');
  //   return Math.round((originalSize * 3) * PixelRatio.get()); //3
  // } else if (PixelRatio.get() >= 3.05 && PixelRatio.get() < 3.2) {
  //   // console.log('Pixel Ratio 2.5');
  //   return Math.round((originalSize * 2.75) * PixelRatio.get()); // 3.1875
  // } else if (PixelRatio.get() >= 3.2 && PixelRatio.get() < 3.5) {
  //   // console.log('Pixel Ratio 2.5');
  //   return Math.round((originalSize * 2.4) * PixelRatio.get()); // 3.375
  // } else {
  //   return originalSize ;
  // }
  return 15
};
