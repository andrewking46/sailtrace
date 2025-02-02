module Api
  module V1
    class BoatsController < BaseController
      include UserOwnedResource

      def index
        @boats = current_user.boats.includes(:boat_class).order(:name)
        render json: @boats, each_serializer: BoatSerializer
      end

      def show
        render json: @boat, serializer: BoatSerializer
      end

      def create
        @boat = current_user.boats.new(boat_params)
        if @boat.save
          render json: @boat, serializer: BoatSerializer, status: :created
        else
          render json: { errors: @boat.errors }, status: :unprocessable_entity
        end
      end

      def update
        if @boat.nil?
          render json: { error: "Boat not found" }, status: :not_found
        elsif @boat.update(boat_params)
          render json: @boat, serializer: BoatSerializer
        else
          render json: { errors: @boat.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @boat.destroy
        head :no_content
      end

      private

      def boat_params
        params.require(:boat).compact_blank.permit(:name, :registration_country, :sail_number, :hull_color,
                                                   :boat_class_id)
      end
    end
  end
end
